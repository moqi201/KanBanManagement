import { z } from "zod";

export const createMemberSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(120, "Nama maksimal 120 karakter."),

    email: z
      .string()
      .trim()
      .email("Format email tidak valid.")
      .max(191, "Email maksimal 191 karakter.")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(12, "Password minimal 12 karakter.")
      .max(128, "Password maksimal 128 karakter."),
  })
  .strict();

export const updateMemberSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(120, "Nama maksimal 120 karakter.")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Format email tidak valid.")
      .max(191, "Email maksimal 191 karakter.")
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined,
    {
      message: "Minimal satu field harus diubah.",
    }
  );

export const updateMemberStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type CreateMemberInput = z.infer<
  typeof createMemberSchema
>;

export type UpdateMemberInput = z.infer<
  typeof updateMemberSchema
>;