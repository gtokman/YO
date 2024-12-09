import { db } from "@/db";
import { usersTable } from "@/db/schema";
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

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, result.sub),
    });

    const friends = await db.query.usersTable.findMany({
      where: eq(usersTable.id, result.sub),
    });

    if (user !== undefined) {
      return new Response(
        JSON.stringify({
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
          friends: friends.map((friend) => ({
            username: friend.username,
          })),
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
