import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import {
  and,
  asc,
  eq,
  ne,
} from "drizzle-orm";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { db } from "../../db";
import { divisions, users } from "../../db/schema";

import type {
  CreateDivisionAdminInput,
  CreateDivisionInput,
  UpdateDivisionInput,
} from "../validators/division.schema";

export class DivisionServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode) {
    super(message);
    this.name = "DivisionServiceError";
    this.status = status;
  }
}

function isDuplicateEntry(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const databaseError = error as {
    code?: unknown;
    errno?: unknown;
  };

  return (
    databaseError.code === "ER_DUP_ENTRY" ||
    databaseError.errno === 1062
  );
}

export async function getAllDivisions() {
  return db
    .select()
    .from(divisions)
    .orderBy(asc(divisions.name));
}

export async function getDivisionById(id: string) {
  const [division] = await db
    .select()
    .from(divisions)
    .where(eq(divisions.id, id))
    .limit(1);

  if (!division) {
    throw new DivisionServiceError(
      "Divisi tidak ditemukan.",
      404
    );
  }

  return division;
}

export async function createDivision(
  input: CreateDivisionInput
) {
  const slug = input.slug.toLowerCase();

  const [existingDivision] = await db
    .select({ id: divisions.id })
    .from(divisions)
    .where(eq(divisions.slug, slug))
    .limit(1);

  if (existingDivision) {
    throw new DivisionServiceError(
      "Slug divisi sudah digunakan.",
      409
    );
  }

  const id = randomUUID();

  try {
    await db.insert(divisions).values({
      id,
      name: input.name,
      slug,
      isActive: true,
    });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new DivisionServiceError(
        "Slug divisi sudah digunakan.",
        409
      );
    }

    throw error;
  }

  return getDivisionById(id);
}

export async function updateDivision(
  id: string,
  input: UpdateDivisionInput
) {
  await getDivisionById(id);

  const updates: {
    name?: string;
    slug?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.slug !== undefined) {
    const slug = input.slug.toLowerCase();

    const [existingDivision] = await db
      .select({ id: divisions.id })
      .from(divisions)
      .where(
        and(
          eq(divisions.slug, slug),
          ne(divisions.id, id)
        )
      )
      .limit(1);

    if (existingDivision) {
      throw new DivisionServiceError(
        "Slug divisi sudah digunakan.",
        409
      );
    }

    updates.slug = slug;
  }

  try {
    await db
      .update(divisions)
      .set(updates)
      .where(eq(divisions.id, id));
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new DivisionServiceError(
        "Slug divisi sudah digunakan.",
        409
      );
    }

    throw error;
  }

  return getDivisionById(id);
}

export async function updateDivisionStatus(
  id: string,
  isActive: boolean
) {
  await getDivisionById(id);

  await db
    .update(divisions)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(divisions.id, id));

  return getDivisionById(id);
}

export async function createDivisionAdmin(
  divisionId: string,
  input: CreateDivisionAdminInput
) {
  const division = await getDivisionById(divisionId);

  if (!division.isActive) {
    throw new DivisionServiceError(
      "Tidak dapat membuat Division Admin pada divisi nonaktif.",
      400
    );
  }

  const email = input.email.toLowerCase();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new DivisionServiceError(
      "Email sudah terdaftar.",
      409
    );
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const id = randomUUID();

  try {
    await db.insert(users).values({
      id,
      divisionId,
      name: input.name,
      email,
      passwordHash,
      role: "division_admin",
      isActive: true,
    });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new DivisionServiceError(
        "Email sudah terdaftar.",
        409
      );
    }

    throw error;
  }

  const [createdUser] = await db
    .select({
      id: users.id,
      divisionId: users.divisionId,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!createdUser) {
    throw new Error(
      "Division Admin berhasil dibuat tetapi gagal dibaca kembali."
    );
  }

  return createdUser;
}