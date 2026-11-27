import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { ZodIssue } from "zod";

import type { AppEnv } from "../types";

import { authMiddleware } from "../middleware/auth.middleware";
import { requireDivisionAdmin } from "../middleware/permission.middleware";

import {
  createMemberSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
} from "../validators/member.schema";

import {
  MemberServiceError,
  getAllMembers,
  createMember,
  updateMember,
  updateMemberStatus,
} from "../services/member.service";

const memberRoutes = new Hono<AppEnv>();

memberRoutes.use("/members", authMiddleware);
memberRoutes.use("/members", requireDivisionAdmin);

memberRoutes.use("/members/*", authMiddleware);
memberRoutes.use("/members/*", requireDivisionAdmin);

function formatValidationErrors(issues: ZodIssue[]) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function handleMemberError(
  c: Context<AppEnv>,
  error: unknown
) {
  if (error instanceof MemberServiceError) {
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
    "Member API error:",
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

const validateCreateMember = zValidator(
  "json",
  createMemberSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data Member tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateUpdateMember = zValidator(
  "json",
  updateMemberSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data perubahan Member tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateMemberStatus = zValidator(
  "json",
  updateMemberStatusSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data status Member tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

// GET /api/members
memberRoutes.get("/members", async (c) => {
  try {
    const user = c.get("authUser");
    const data = await getAllMembers(user);

    return c.json({
      success: true,
      message: "Daftar Member berhasil diambil.",
      data: {
        members: data,
        total: data.length,
      },
    });
  } catch (error) {
    return handleMemberError(c, error);
  }
});

// POST /api/members
memberRoutes.post(
  "/members",
  validateCreateMember,
  async (c) => {
    try {
      const user = c.get("authUser");
      const input = c.req.valid("json");

      const data = await createMember(user, input);

      return c.json(
        {
          success: true,
          message: "Member berhasil dibuat.",
          data: {
            member: data,
          },
        },
        201
      );
    } catch (error) {
      return handleMemberError(c, error);
    }
  }
);

// PATCH /api/members/:id
memberRoutes.patch(
  "/members/:id",
  validateUpdateMember,
  async (c) => {
    try {
      const user = c.get("authUser");
      const memberId = c.req.param("id");
      const input = c.req.valid("json");

      const data = await updateMember(
        user,
        memberId,
        input
      );

      return c.json({
        success: true,
        message: "Data Member berhasil diperbarui.",
        data: {
          member: data,
        },
      });
    } catch (error) {
      return handleMemberError(c, error);
    }
  }
);

// PATCH /api/members/:id/status
memberRoutes.patch(
  "/members/:id/status",
  validateMemberStatus,
  async (c) => {
    try {
      const user = c.get("authUser");
      const memberId = c.req.param("id");
      const { isActive } = c.req.valid("json");

      const data = await updateMemberStatus(
        user,
        memberId,
        isActive
      );

      return c.json({
        success: true,
        message: isActive
          ? "Member berhasil diaktifkan."
          : "Member berhasil dinonaktifkan dan seluruh session dicabut.",
        data: {
          member: data,
        },
      });
    } catch (error) {
      return handleMemberError(c, error);
    }
  }
);

export { memberRoutes };