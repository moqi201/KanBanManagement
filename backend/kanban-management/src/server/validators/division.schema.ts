import { z } from "zod";

const divisionNameSchema = z
  .string()
  .trim()
  .min(2, "Nama divisi minimal 2 karakter.")
  .max(100, "Nama divisi maksimal 100 karakter.");

const divisionSlugSchema = z
  .string()
  .trim()
  .min(2, "Slug minimal 2 karakter.")
  .max(100, "Slug maksimal 100 karakter.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh menggunakan huruf kecil, angka, dan tanda hubung."
  );

export const createDivisionSchema = z
  .object({
    name: divisionNameSchema,
    slug: divisionSlugSchema,
  })
  .strict();

export const updateDivisionSchema = z
  .object({
    name: divisionNameSchema.optional(),
    slug: divisionSlugSchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.slug !== undefined,
    {
      message: "Minimal satu field harus diisi.",
    }
  );

export const updateDivisionStatusSchema = z
  .object({
    isActive: z.boolean({
      error: "Status isActive wajib berupa boolean.",
    }),
  })
  .strict();

export const createDivisionAdminSchema = z
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

export type CreateDivisionInput = z.infer<
  typeof createDivisionSchema
>;

export type UpdateDivisionInput = z.infer<
  typeof updateDivisionSchema
>;

export type UpdateDivisionStatusInput = z.infer<
  typeof updateDivisionStatusSchema
>;

export type CreateDivisionAdminInput = z.infer<
  typeof createDivisionAdminSchema
>;