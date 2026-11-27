
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";

async function seed() {
  loadEnvConfig(process.cwd());

  const [{ db }, { users }] = await Promise.all([
    import("./index"),
    import("./schema/users"),
  ]);

  const name = process.env.SEED_PLATFORM_ADMIN_NAME?.trim();
  const email = process.env.SEED_PLATFORM_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();
  const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "SEED_PLATFORM_ADMIN_NAME, SEED_PLATFORM_ADMIN_EMAIL, dan SEED_PLATFORM_ADMIN_PASSWORD wajib diisi."
    );
  }

  if (password.length < 12) {
    throw new Error("Password Platform Admin minimal 12 karakter.");
  }

  const [existingUser] = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      divisionId: users.divisionId,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const isValid =
      existingUser.name === name &&
      existingUser.role === "platform_admin" &&
      existingUser.divisionId === null;

    if (!isValid) {
      throw new Error(
        "Email sudah digunakan, tetapi konfigurasi user tidak sesuai dengan Platform Admin."
      );
    }

    console.log("Platform Admin sudah tersedia. Seeder dilewati.");
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  await db.insert(users).values({
    id: randomUUID(),
    divisionId: null,
    name,
    email,
    passwordHash,
    role: "platform_admin",
    isActive: true,
  });

  console.log("Platform Admin berhasil dibuat.");
}

seed().catch((error) => {
  console.error(
    "Database seeding gagal:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
