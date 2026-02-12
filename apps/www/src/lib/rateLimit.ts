import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(5, "10 m"),
      })
    : null;

function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(request: Request) {
  if (!ratelimit) {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        status: 500,
        error: "Rate limiting not configured",
        limit: 0,
        remaining: 0,
        reset: Date.now(),
      };
    }
    console.warn("[rateLimit] Upstash not configured; skipping rate limit");
    return { success: true, limit: 0, remaining: 0, reset: Date.now() };
  }

  const ip = getRequestIp(request);
  return ratelimit.limit(`contact:${ip}`);
}
