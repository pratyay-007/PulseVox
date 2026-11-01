import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

/**
 * Returns a singleton instance of the Upstash Redis client.
 * Lazy-initialized so importing this module never throws if env vars are missing.
 */
export function getRedis(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Upstash Redis credentials. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local"
    );
  }

  redisInstance = new Redis({
    url,
    token,
  });

  return redisInstance;
}

