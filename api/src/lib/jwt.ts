import jwt from "jsonwebtoken";
import { compileValidator } from "./validator";
import { SessionToken } from "@/types/session-token";

export function generateSessionToken({
  userId,
  sessionId,
  exp,
}: {
  userId: string;
  sessionId: string;
  exp: Date;
}) {
  const privatebase64Key = process.env.PRIVATE_KEY!;
  const privateKey = Buffer.from(privatebase64Key, "base64").toString("utf-8");
  return jwt.sign(
    {
      sub: userId,
      sid: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(exp.getTime() / 1000),
    },
    privateKey,
    {
      algorithm: "RS256",
    }
  );
}

export function validateSessionToken(token: string): SessionToken {
  try {
    const publicbase64Key = process.env.PUBLIC_KEY!;
    const publicKey = Buffer.from(publicbase64Key, "base64").toString("utf-8");

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    });
    const validator = compileValidator(SessionToken);
    const { body, error } = validator(decoded);
    if (error !== undefined) {
      throw new Error(`Invalid token: ${error.message}`);
    }
    return body!;
  } catch (err: unknown) {
    if (!(err instanceof Error)) {
      throw new Error("Unknown error");
    }
    throw new Error(`Invalid token: ${err.message}`);
  }
}