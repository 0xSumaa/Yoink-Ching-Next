import redis from "./redis-client";

export async function checkRateLimit(fid: string): Promise<boolean> {
  const key = `ratelimit:intro:${fid}`;
  const result = await redis.set(key, "true", "EX", 10, "NX");
  return result === "OK";
}
