import Redis from "ioredis";
import { getConfig } from "@/lib/config";

declare global {
  var redisClient: Redis | undefined;
}

export function getRedisClient(): Redis | null {
  const { redisUrl } = getConfig().secrets;
  if (!redisUrl) return null;

  if (!global.redisClient) {
    global.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    
    global.redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }

  return global.redisClient;
}
