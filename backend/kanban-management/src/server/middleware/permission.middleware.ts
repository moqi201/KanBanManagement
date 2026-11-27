import { createMiddleware } from "hono/factory";
import type { AppEnv, UserRole } from "../types";

export const requireRoles = (...allowedRoles: UserRole[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("authUser");

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu",
          errors: [],
        },
        401
      );
    }

    
    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          message: "Anda tidak memiliki izin untuk mengakses resource ini",
          errors: [],
        },
        403
      );
    }

    await next();
  });

export const requirePlatformAdmin = requireRoles("platform_admin");

export const requireDivisionAdmin = requireRoles("division_admin");

export const requireDivisionMember = requireRoles(
  "division_admin",
  "member"
);