
import type { MiddlewareHandler } from "hono";
import {
  getCookie,
  deleteCookie,
} from "hono/cookie";

import type { AppEnv } from "../types";

import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../services/auth.service";

const isProduction = process.env.NODE_ENV === "production";

export const authMiddleware: MiddlewareHandler<AppEnv> =
  async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE_NAME);

    if (!token) {
      return c.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
          errors: [],
        },
        401
      );
    }

    const session = await resolveSession(token);

    if (!session) {
      deleteCookie(c, SESSION_COOKIE_NAME, {
        path: "/",
        secure: isProduction,
      });

      return c.json(
        {
          success: false,
          message: "Session tidak valid atau sudah kedaluwarsa.",
          errors: [],
        },
        401
      );
    }

    c.set("authUser", session.user);
    c.set("sessionId", session.sessionId);

    await next();
  };
