import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import type { AppEnv } from "../types";

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getRequestOrigin(c: Context): string | null {
  const forwardedHost = c.req
    .header("x-forwarded-host")
    ?.split(",")[0]
    .trim();

  const host = forwardedHost || c.req.header("host");

  if (!host) {
    try {
      return new URL(c.req.url).origin;
    } catch {
      return null;
    }
  }

  const forwardedProto = c.req
    .header("x-forwarded-proto")
    ?.split(",")[0]
    .trim();

  const protocol =
    forwardedProto ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return normalizeOrigin(`${protocol}://${host}`);
}

function getAllowedOrigins(c: Context): Set<string> {
  const configuredOrigins = [
    process.env.APP_ORIGIN,
    ...(process.env.CORS_ORIGINS ?? "").split(","),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => value !== null);

  const requestOrigin = getRequestOrigin(c);

  if (requestOrigin) {
    configuredOrigins.push(requestOrigin);
  }

  return new Set(configuredOrigins);
}

export function isAllowedOrigin(
  origin: string,
  c: Context
): boolean {
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  return getAllowedOrigins(c).has(normalizedOrigin);
}

export const corsMiddleware = cors({
  origin: (origin, c) => {
    if (!origin) {
      return undefined;
    }

    return isAllowedOrigin(origin, c) ? origin : undefined;
  },
  allowMethods: [
    "GET",
    "HEAD",
    "POST",
    "PATCH",
    "PUT",
    "DELETE",
    "OPTIONS",
  ],
  allowHeaders: [
    "Content-Type",
    "Authorization",
  ],
  credentials: true,
  maxAge: 600,
});

export const csrfMiddleware = createMiddleware<AppEnv>(
  async (c, next) => {
    const method = c.req.method.toUpperCase();

    const isMutation = [
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ].includes(method);

    if (!isMutation) {
      await next();
      return;
    }

    const origin = c.req.header("origin");
    const fetchSite = c.req.header("sec-fetch-site");

    if (origin && !isAllowedOrigin(origin, c)) {
      return c.json(
        {
          success: false,
          message: "Request ditolak karena origin tidak diizinkan.",
          errors: [],
        },
        403
      );
    }

    if (!origin && fetchSite === "cross-site") {
      return c.json(
        {
          success: false,
          message: "Request lintas situs ditolak.",
          errors: [],
        },
        403
      );
    }

    await next();
  }
);