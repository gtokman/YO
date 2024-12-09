import { db } from "@/db";
import { sessionsTable, usersTable } from "@/db/schema";
import { isPasswordCorrect } from "@/lib/hash";
import { generateSessionToken } from "@/lib/jwt";
import { compileBodyValidator } from "@/lib/validator";
import { EmailPasswordModel } from "@/types/sign-up";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const validateSignUpBody = compileBodyValidator(EmailPasswordModel);
    const { body, error } = await validateSignUpBody(request);
    if (error !== undefined) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = body!;

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });

    if (user !== undefined) {
      const { passwordHash, salt, iterationCount } = user;
      const isValidPassword = isPasswordCorrect({
        savedHash: passwordHash,
        savedSalt: salt,
        savedIterations: iterationCount,
        userPassword: password,
      });
      if (!isValidPassword) {
        return new Response(JSON.stringify({ error: "Invalid password." }), {
          status: 401,
        });
      }
      const sessionId = crypto.randomUUID();
      const twoWeeks = 60 * 60 * 24 * 14;
      const accessToken = generateSessionToken({
        userId: user.id,
        sessionId,
        exp: new Date(Date.now() + twoWeeks * 1000),
      });

      await db
        .update(sessionsTable)
        .set({
          expiresAt: new Date(Date.now() + twoWeeks * 1000),
          createdAt: new Date(),
          sessionToken: sessionId,
        })
        .where(eq(sessionsTable.userId, user.id));

      return new Response(JSON.stringify({ accessToken }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: "Invalid email or password." }),
      {
        status: 401,
      }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred.",
      }),
      {
        status: 500,
      }
    );
  }
}
