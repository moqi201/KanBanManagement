import { z } from "zod";

const taskStatuses = ["todo", "in_progress", "done"] as const;
const taskPriorities = ["low", "medium", "high"] as const;

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Tanggal tidak valid.");

const assigneeIdsSchema = z
  .array(z.string().uuid("ID assignee harus berupa UUID."))
  .max(100, "Maksimal 100 assignee dalam satu task.")
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "ID assignee tidak boleh duplikat."
  );

export const taskQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    status: z.enum(taskStatuses).optional(),
    priority: z.enum(taskPriorities).optional(),
    assigneeId: z.string().uuid().optional(),
  })
  .strict();

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul task wajib diisi.")
      .max(160, "Judul task maksimal 160 karakter."),

    description: z
      .string()
      .max(10000, "Deskripsi maksimal 10.000 karakter.")
      .nullable()
      .optional(),

    status: z.enum(taskStatuses).optional(),

    priority: z.enum(taskPriorities).optional(),

    dueDate: dueDateSchema.nullable().optional(),

    assigneeIds: assigneeIdsSchema.optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul task wajib diisi.")
      .max(160, "Judul task maksimal 160 karakter.")
      .optional(),

    description: z
      .string()
      .max(10000, "Deskripsi maksimal 10.000 karakter.")
      .nullable()
      .optional(),

    status: z.enum(taskStatuses).optional(),

    priority: z.enum(taskPriorities).optional(),

    dueDate: dueDateSchema.nullable().optional(),

    assigneeIds: assigneeIdsSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.values(data).some((value) => value !== undefined),
    {
      message: "Minimal satu field harus diubah.",
    }
  );

export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;