import { db } from "@/db";
import { messagesTable, usersTable } from "@/db/schema";
import { validateSessionToken } from "@/lib/jwt";
import { client } from "@/lib/push";
import { compileBodyValidator } from "@/lib/validator";
import { AccessToken } from "@/types/access-token";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { Notification } from "apns2";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const accessToken = Value.Decode(
      AccessToken,
      request.headers.get("Authorization")
    );

    const result = validateSessionToken(accessToken);

    const validateBody = compileBodyValidator(
      Type.Object({
        username: Type.String({ minLength: 2, maxLength: 16 }),
      })
    );
    const { body, error } = await validateBody(request);
    if (error !== undefined) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { username } = body!;

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, result.sub),
    });

    const friend = await db.query.usersTable.findFirst({
      where: eq(usersTable.username, username),
    });

    if (user === undefined || friend === undefined) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isFriend = await db.query.friendsTable.findFirst({
      where: and(eq(usersTable.id, user.id), eq(usersTable.id, friend.id)),
    });

    if (isFriend === undefined) {
      return new Response(JSON.stringify({ error: "You are not friends." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const friendPushToken = friend.pushToken;
    // TODO: handle friendPushToken === null
    if (friendPushToken !== null) {
      // Send push notification
      await client.send(
        new Notification(friendPushToken, {
          alert: "Yo!",
          data: {
            type: "message",
            username: user.username,
          },
        })
      );

      await db.insert(messagesTable).values({
        senderId: user.id,
        receiverId: friend.id,
        message: "Yo!",
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({
          error: `Tell ${friend.username} to enable push notifications.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
export async function GET(request: Request) {}
