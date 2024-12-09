import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { niceInsults } from "@/lib/constants";
import { hashPassword } from "@/lib/hash";
import { isRateLimited, storeRateLimit } from "@/lib/redis";
import { compileBodyValidator } from "@/lib/validator";
import { Type } from "@sinclair/typebox";

const validateInvitationBody = compileBodyValidator(
  Type.Object(
    {
      email: Type.String({ format: "email" }),
      password: Type.String({
        minLength: 8,
        pattern: "^[a-zA-Z0-9_]+$",
      }),
      username: Type.String({
        minLength: 2,
        pattern: "^[a-zA-Z0-9_]+$",
      }),
      // fu: Type.String({
      //   minLength: 36,
      //   pattern:
      //     "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
      // }),
    },
    { additionalProperties: false }
  )
);

export async function POST(request: Request) {
  try {
    const { body, error } = await validateInvitationBody(request);
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
      console.log("Parsed client IP:", parsedIP);
      console.log("ip address", clientIP);
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
    // TODO: Store ip in Redis for rate limiting
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

    return new Response(JSON.stringify(result[0]), {
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
