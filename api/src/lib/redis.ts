import { isProduction } from "@/environment";
import Redis from "ioredis";

const redis = new Redis(
  isProduction ? process.env.REDIS_URL! : process.env.REDIS_PUBLIC_URL!
);

async function storeRateLimit({ ip, ttl }: { ip: string; ttl: number }) {
  const key = `rate-limit:${ip}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, ttl);
  }

  return current;
}

async function isRateLimited({ ip, limit }: { ip: string; limit: number }) {
  const count = await redis.get(`rate-limit:${ip}`);
  return count !== null && parseInt(count, 10) > limit;
}

export { storeRateLimit, isRateLimited };
