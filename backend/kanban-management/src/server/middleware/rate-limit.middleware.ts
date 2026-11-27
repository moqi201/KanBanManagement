import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";
import type { Context } from "hono";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitEntry>();

function getClientKey(c: Context<AppEnv>): string {
  const realIp = c.req.header("x-real-ip");

  const forwardedIp = c.req
    .header("x-forwarded-for")
    ?.split(",")[0]
    .trim();

  return realIp || forwardedIp || "unknown";
}
function cleanupExpiredEntries(now: number) {
  if (attempts.size <= 5000) {
    return;
  }

  for (const [key, entry] of attempts.entries()) {
    if (entry.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

export const loginRateLimit = createMiddleware<AppEnv>(
  async (c, next) => {
    const now = Date.now();
    const key = getClientKey(c);

    cleanupExpiredEntries(now);

    let entry = attempts.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + WINDOW_MS,
      };
    }

    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.max(
        1,
        Math.ceil((entry.resetAt - now) / 1000)
      );

      c.header("Retry-After", String(retryAfter));

      return c.json(
        {
          success: false,
          message: "Terlalu banyak percobaan login. Silakan coba kembali nanti.",
          errors: [],
        },
        429
      );
    }

    entry.count += 1;
    attempts.set(key, entry);

    await next();

    if (c.res.status < 400) {
      attempts.delete(key);
    }
  }
);