import { db } from "@/db";
import { sessionsTable, usersTable } from "@/db/schema";
import { niceInsults } from "@/lib/constants";
import { hashPassword } from "@/lib/hash";
import { generateSessionToken } from "@/lib/jwt";
import { isRateLimited, storeRateLimit } from "@/lib/redis";
import { compileBodyValidator } from "@/lib/validator";
import { SignUpBodyModel } from "@/types/sign-up";

export async function POST(request: Request) {
  try {
    const validateSignUpBody = compileBodyValidator(SignUpBodyModel);
    const { body, error } = await validateSignUpBody(request);
    if (error !== undefined) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const clientIP =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for");

    const parsedIP = clientIP?.startsWith("::ffff:")
      ? clientIP.substring(7)
      : clientIP;
    if (parsedIP !== null) {
      const isLimited = await isRateLimited({
        ip: parsedIP,
        limit: 5,
      });
      if (isLimited) {
        return new Response(
          JSON.stringify({
            error: niceInsults[Math.floor(Math.random() * niceInsults.length)],
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      await storeRateLimit({
        ip: parsedIP,
        ttl: 120,
      });
    }
    const { email, password, username } = body!;
    const { hash, iterations, salt } = hashPassword(password);
    // TODO: Verify the fu token (device check)
    const result = await db
      .insert(usersTable)
      .values({
        email,
        passwordHash: hash,
        salt,
        iterationCount: iterations,
        username,
      })
      .$returningId();

    const sessionId = crypto.randomUUID();
    const twoWeeks = 60 * 60 * 24 * 14;
    const accessToken = generateSessionToken({
      userId: result[0].id,
      sessionId,
      exp: new Date(Date.now() + twoWeeks * 1000),
    });

    await db.insert(sessionsTable).values({
      userId: result[0].id,
      expiresAt: new Date(Date.now() + twoWeeks * 1000),
      sessionToken: sessionId,
    });

    return new Response(JSON.stringify({ accessToken }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: "An unknown error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
