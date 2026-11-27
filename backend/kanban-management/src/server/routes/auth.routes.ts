
import { Hono } from "hono";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

import type { AppEnv } from "../types";

import { loginSchema } from "../validators/auth.schema";
import { loginRateLimit } from "../middleware/rate-limit.middleware";

import {
  AuthServiceError,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  loginWithCredentials,
  revokeSession,
} from "../services/auth.service";

import { authMiddleware } from "../middleware/auth.middleware";

const authRoutes = new Hono<AppEnv>();

const isProduction = process.env.NODE_ENV === "production";

const validateLogin = zValidator(
  "json",
  loginSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data login tidak valid.",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        400
      );
    }
  }
);

authRoutes.post(
  "/login",
  loginRateLimit,
  validateLogin,
  async (c) => {
    try {
      const { email, password } = c.req.valid("json");

      const result = await loginWithCredentials(
        email,
        password
      );
      const isProduction = process.env.NODE_ENV === "production";
      setCookie(
        c,
        SESSION_COOKIE_NAME,
        result.token,
        {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "None" : "Lax",
          path: "/",
          maxAge: SESSION_TTL_SECONDS,
          expires: result.expiresAt,
        }
      );

      return c.json({
        success: true,
        message: "Login berhasil.",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return c.json(
          {
            success: false,
            message: error.message,
            errors: [],
          },
          error.status
        );
      }

      console.error(
        "Login error:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return c.json(
        {
          success: false,
          message: "Terjadi kesalahan pada server.",
          errors: [],
        },
        500
      );
    }
  }
);

authRoutes.get(
  "/me",
  authMiddleware,
  (c) => {
    const user = c.get("authUser");

    return c.json({
      success: true,
      message: "Profil berhasil diambil.",
      data: {
        user,
      },
    });
  }
);

authRoutes.post(
  "/logout",
  async (c) => {
    const token = getCookie(c, SESSION_COOKIE_NAME);

    deleteCookie(c, SESSION_COOKIE_NAME, {
      path: "/",
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
    });

    try {
      if (token) {
        await revokeSession(token);
      }

      return c.json({
        success: true,
        message: "Logout berhasil.",
        data: null,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return c.json(
        {
          success: false,
          message: "Gagal menghapus session.",
          errors: [],
        },
        500
      );
    }
  }
);

export { authRoutes };
