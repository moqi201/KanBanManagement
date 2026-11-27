import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
