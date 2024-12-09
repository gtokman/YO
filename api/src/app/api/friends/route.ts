import { db } from "@/db";
import { friendRequestsTable, friendsTable, usersTable } from "@/db/schema";
import { validateSessionToken } from "@/lib/jwt";
import { compileBodyValidator } from "@/lib/validator";
import { AccessToken } from "@/types/access-token";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { and, eq } from "drizzle-orm";
import { Notification } from "apns2";
import { client } from "@/lib/push";

export async function DELETE(request: Request) {
  try {
    const accessToken = Value.Decode(
      AccessToken,
      request.headers.get("Authorization")
    );

    const result = validateSessionToken(accessToken);

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, result.sub),
    });

    if (user !== undefined) {
      await db.delete(friendsTable).where(eq(friendsTable.userId, user.id));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "User not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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

export async function GET(request: Request) {
  try {
    const accessToken = Value.Decode(
      AccessToken,
      request.headers.get("Authorization")
    );

    const result = validateSessionToken(accessToken);

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, result.sub),
    });

    if (user !== undefined) {
      const friends = await db
        .select({
          friendId: friendsTable.friendId,
          friendUsername: usersTable.username,
          friendEmail: usersTable.email,
        })
        .from(usersTable)
        .leftJoin(friendsTable, eq(friendsTable.friendId, usersTable.id))
        .where(eq(friendsTable.userId, user.id));

      return new Response(
        JSON.stringify({
          friends,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "User not found." }), {
      status: 404,
    });
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

export async function POST(request: Request) {
  try {
    const accessToken = Value.Decode(
      AccessToken,
      request.headers.get("Authorization")
    );

    const result = validateSessionToken(accessToken);

    const validateBody = compileBodyValidator(
      Type.Object({
        friendUsername: Type.String({
          minLength: 2,
        }),
      })
    );
    const { body, error } = await validateBody(request);
    if (error !== undefined) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const username = body!.friendUsername;

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

    await db.insert(friendRequestsTable).values({
      senderId: user.id,
      receiverId: friend.id,
    });
    // TODO: Send push to friend
    if (friend.pushToken === null) {
      return new Response(
        JSON.stringify({
          error: "Friend has no push token.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await client.send(
      new Notification(friend.pushToken, {
        alert: "HI!",
        sound: "default",
        data: {
          type: "friend-request",
          senderId: user.id,
          senderUsername: user.username,
        },
      })
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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

export async function PATCH(request: Request) {
  try {
    const accessToken = Value.Decode(
      AccessToken,
      request.headers.get("Authorization")
    );

    const result = validateSessionToken(accessToken);

    const validateBody = compileBodyValidator(
      Type.Object({
        friendId: Type.String(),
        status: Type.Union([
          Type.Literal("accepted"),
          Type.Literal("rejected"),
        ]),
      })
    );
    const { body, error } = await validateBody(request);
    if (error !== undefined) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { friendId, status } = body!;

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, result.sub),
    });

    const friend = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, friendId),
    });

    if (user === undefined || friend === undefined) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (status === "accepted") {
      await Promise.all([
        db.insert(friendsTable).values({
          userId: user.id,
          friendId: friend.id,
        }),
        db.insert(friendsTable).values({
          userId: friend.id,
          friendId: user.id,
        }),
      ]);
    }

    await db
      .update(friendRequestsTable)
      .set({
        status: status,
      })
      .where(
        and(
          eq(friendRequestsTable.senderId, friend.id),
          eq(friendRequestsTable.receiverId, user.id)
        )
      );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
