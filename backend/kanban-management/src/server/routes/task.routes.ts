import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { ZodIssue } from "zod";

import type { AppEnv } from "../types";

import { authMiddleware } from "../middleware/auth.middleware";
import { requireDivisionMember } from "../middleware/permission.middleware";

import {
  taskQuerySchema,
  createTaskSchema,
  updateTaskSchema,
} from "../validators/task.schema";

import {
  TaskServiceError,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../services/task.service";

const taskRoutes = new Hono<AppEnv>();

taskRoutes.use("/tasks", authMiddleware);
taskRoutes.use("/tasks", requireDivisionMember);

taskRoutes.use("/tasks/*", authMiddleware);
taskRoutes.use("/tasks/*", requireDivisionMember);

function formatValidationErrors(issues: ZodIssue[]) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function handleTaskError(
  c: Context<AppEnv>,
  error: unknown
) {
  if (error instanceof TaskServiceError) {
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
    "Task API error:",
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

const validateTaskQuery = zValidator(
  "query",
  taskQuerySchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Parameter pencarian tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateCreateTask = zValidator(
  "json",
  createTaskSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data task tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

const validateUpdateTask = zValidator(
  "json",
  updateTaskSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Data perubahan task tidak valid.",
          errors: formatValidationErrors(result.error.issues),
        },
        400
      );
    }
  }
);

// GET /api/tasks
taskRoutes.get(
  "/tasks",
  validateTaskQuery,
  async (c) => {
    try {
      const user = c.get("authUser");
      const filters = c.req.valid("query");

      const data = await getAllTasks(user, filters);

      return c.json({
        success: true,
        message: "Daftar task berhasil diambil.",
        data: {
          tasks: data,
          total: data.length,
        },
      });
    } catch (error) {
      return handleTaskError(c, error);
    }
  }
);

// GET /api/tasks/:id
taskRoutes.get(
  "/tasks/:id",
  async (c) => {
    try {
      const user = c.get("authUser");
      const id = c.req.param("id");

      const data = await getTaskById(user, id);

      return c.json({
        success: true,
        message: "Detail task berhasil diambil.",
        data: {
          task: data,
        },
      });
    } catch (error) {
      return handleTaskError(c, error);
    }
  }
);

// POST /api/tasks
taskRoutes.post(
  "/tasks",
  validateCreateTask,
  async (c) => {
    try {
      const user = c.get("authUser");
      const input = c.req.valid("json");

      const data = await createTask(user, input);

      return c.json(
        {
          success: true,
          message: "Task berhasil dibuat.",
          data: {
            task: data,
          },
        },
        201
      );
    } catch (error) {
      return handleTaskError(c, error);
    }
  }
);

// PATCH /api/tasks/:id
taskRoutes.patch(
  "/tasks/:id",
  validateUpdateTask,
  async (c) => {
    try {
      const user = c.get("authUser");
      const id = c.req.param("id");
      const input = c.req.valid("json");

      const data = await updateTask(
        user,
        id,
        input
      );

      return c.json({
        success: true,
        message: "Task berhasil diperbarui.",
        data: {
          task: data,
        },
      });
    } catch (error) {
      return handleTaskError(c, error);
    }
  }
);

// DELETE /api/tasks/:id
taskRoutes.delete(
  "/tasks/:id",
  async (c) => {
    try {
      const user = c.get("authUser");
      const id = c.req.param("id");

      await deleteTask(user, id);

      return c.json({
        success: true,
        message: "Task berhasil dihapus.",
        data: null,
      });
    } catch (error) {
      return handleTaskError(c, error);
    }
  }
);

export { taskRoutes };