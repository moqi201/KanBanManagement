import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { ZodIssue } from "zod";
import type { AppEnv } from "../types";

import { authMiddleware } from "../middleware/auth.middleware";
import { requirePlatformAdmin } from "../middleware/permission.middleware";

import {
  createDivisionSchema,
  updateDivisionSchema,
  updateDivisionStatusSchema,
  createDivisionAdminSchema,
} from "../validators/division.schema";

import {
  DivisionServiceError,
  getAllDivisions,
  getDivisionById,
  createDivision,
  updateDivision,
  updateDivisionStatus,
  createDivisionAdmin,
} from "../services/division.service";

const divisionRoutes = new Hono<AppEnv>();

divisionRoutes.use("/divisions", authMiddleware);
divisionRoutes.use("/divisions", requirePlatformAdmin);

divisionRoutes.use("/divisions/*", authMiddleware);
divisionRoutes.use("/divisions/*", requirePlatformAdmin);

function formatValidationErrors(issues: ZodIssue[]) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function handleDivisionError(
  c: Context<AppEnv>,
  error: unknown
) {
  if (error instanceof DivisionServiceError) {
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
    "Division API error:",
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

const validateCreateDivision = zValidator(
  "json",
  createDivisionSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data divisi tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateUpdateDivision = zValidator(
  "json",
  updateDivisionSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data perubahan divisi tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateDivisionStatus = zValidator(
  "json",
  updateDivisionStatusSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data status divisi tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateCreateDivisionAdmin = zValidator(
  "json",
  createDivisionAdminSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data Division Admin tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

// GET /api/divisions
divisionRoutes.get("/divisions", async (c) => {
  try {
    const data = await getAllDivisions();

    return c.json({
      success: true,
      message: "Daftar divisi berhasil diambil.",
      data,
    });
  } catch (error) {
    return handleDivisionError(c, error);
  }
});

// POST /api/divisions
divisionRoutes.post(
  "/divisions",
  validateCreateDivision,
  async (c) => {
    try {
      const input = c.req.valid("json");
      const data = await createDivision(input);

      return c.json(
        {
          success: true,
          message: "Divisi berhasil dibuat.",
          data,
        },
        201
      );
    } catch (error) {
      return handleDivisionError(c, error);
    }
  }
);

// GET /api/divisions/:id
divisionRoutes.get("/divisions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await getDivisionById(id);

    return c.json({
      success: true,
      message: "Detail divisi berhasil diambil.",
      data,
    });
  } catch (error) {
    return handleDivisionError(c, error);
  }
});

// PATCH /api/divisions/:id
divisionRoutes.patch(
  "/divisions/:id",
  validateUpdateDivision,
  async (c) => {
    try {
      const id = c.req.param("id");
      const input = c.req.valid("json");
      const data = await updateDivision(id, input);

      return c.json({
        success: true,
        message: "Divisi berhasil diperbarui.",
        data,
      });
    } catch (error) {
      return handleDivisionError(c, error);
    }
  }
);

// PATCH /api/divisions/:id/status
divisionRoutes.patch(
  "/divisions/:id/status",
  validateDivisionStatus,
  async (c) => {
    try {
      const id = c.req.param("id");
      const { isActive } = c.req.valid("json");

      const data = await updateDivisionStatus(
        id,
        isActive
      );

      return c.json({
        success: true,
        message: isActive
          ? "Divisi berhasil diaktifkan."
          : "Divisi berhasil dinonaktifkan.",
        data,
      });
    } catch (error) {
      return handleDivisionError(c, error);
    }
  }
);

// POST /api/divisions/:id/admins
divisionRoutes.post(
  "/divisions/:id/admins",
  validateCreateDivisionAdmin,
  async (c) => {
    try {
      const divisionId = c.req.param("id");
      const input = c.req.valid("json");

      const data = await createDivisionAdmin(
        divisionId,
        input
      );

      return c.json(
        {
          success: true,
          message: "Division Admin berhasil dibuat.",
          data,
        },
        201
      );
    } catch (error) {
      return handleDivisionError(c, error);
    }
  }
);

export { divisionRoutes };