import crypto from "crypto";

function hashPassword(password: string): {
  salt: string;
  hash: string;
  iterations: number;
} {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 10000;
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha256")
    .toString("hex");
  return { salt, hash, iterations };
}

function isPasswordCorrect({
  savedHash,
  savedSalt,
  savedIterations,
  userPassword,
}: {
  savedHash: string;
  savedSalt: string;
  savedIterations: number;
  userPassword: string;
}): boolean {
  const hash = crypto
    .pbkdf2Sync(userPassword, savedSalt, savedIterations, 64, "sha256")
    .toString("hex");
  return savedHash === hash;
}

export { hashPassword, isPasswordCorrect };
