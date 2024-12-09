import { db } from "@/db";
import { friendRequestsTable, friendsTable, usersTable } from "@/db/schema";
import { validateSessionToken } from "@/lib/jwt";
import { AccessToken } from "@/types/access-token";
import { Value } from "@sinclair/typebox/value";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const accessToken = Value.Decode(
      AccessToken,
      request.headers.get("Authorization")
    );

    const result = validateSessionToken(accessToken);

    const userPromise = db.query.usersTable.findFirst({
      where: eq(usersTable.id, result.sub),
    });

    const friendsPromise = db
      .select({
        username: usersTable.username,
        userId: usersTable.id,
      })
      .from(usersTable)
      .leftJoin(friendsTable, eq(friendsTable.userId, usersTable.id));

    const friendRequestsPromise = db
      .select({
        username: usersTable.username,
        userId: usersTable.id,
        status: friendRequestsTable.status,
      })
      .from(friendRequestsTable)
      .leftJoin(usersTable, eq(friendRequestsTable.receiverId, usersTable.id))
      .where(eq(friendRequestsTable.senderId, result.sub));

    const [user, friends, friendRequests] = await Promise.all([
      userPromise,
      friendsPromise,
      friendRequestsPromise,
    ]);

    if (user !== undefined) {
      return new Response(
        JSON.stringify({
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
          friends,
          friendRequests,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("User not found.", {
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

export async function PATCH(request: Request) {}

export async function DELETE(request: Request) {}
