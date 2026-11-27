import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["admin", "member"]),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
