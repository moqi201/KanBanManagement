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
import {
  divisions,
  sessions,
  users,
} from "../../db/schema";

import type { AuthenticatedUser } from "../types";

import type {
  CreateMemberInput,
  UpdateMemberInput,
} from "../validators/member.schema";

export class MemberServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode) {
    super(message);
    this.name = "MemberServiceError";
    this.status = status;
  }
}

function getDivisionId(user: AuthenticatedUser): string {
  if (!user.divisionId) {
    throw new MemberServiceError(
      "Akun ini tidak memiliki divisi.",
      403
    );
  }

  return user.divisionId;
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

async function ensureActiveDivision(divisionId: string) {
  const [division] = await db
    .select({
      id: divisions.id,
      isActive: divisions.isActive,
    })
    .from(divisions)
    .where(eq(divisions.id, divisionId))
    .limit(1);

  if (!division || !division.isActive) {
    throw new MemberServiceError(
      "Divisi tidak ditemukan atau sedang nonaktif.",
      403
    );
  }
}

async function getScopedMember(
  memberId: string,
  divisionId: string
) {
  const [member] = await db
    .select({
      id: users.id,
      divisionId: users.divisionId,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(
      and(
        eq(users.id, memberId),
        eq(users.divisionId, divisionId),
        eq(users.role, "member")
      )
    )
    .limit(1);

  if (!member) {
    throw new MemberServiceError(
      "Member tidak ditemukan.",
      404
    );
  }

  return member;
}

export async function getAllMembers(
  user: AuthenticatedUser
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  return db
    .select({
      id: users.id,
      divisionId: users.divisionId,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(
      and(
        eq(users.divisionId, divisionId),
        eq(users.role, "member")
      )
    )
    .orderBy(asc(users.name));
}

export async function createMember(
  user: AuthenticatedUser,
  input: CreateMemberInput
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);

  const email = input.email.toLowerCase();

  const [existingUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new MemberServiceError(
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
      role: "member",
      isActive: true,
    });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new MemberServiceError(
        "Email sudah terdaftar.",
        409
      );
    }

    throw error;
  }

  return getScopedMember(id, divisionId);
}

export async function updateMember(
  user: AuthenticatedUser,
  memberId: string,
  input: UpdateMemberInput
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);
  await getScopedMember(memberId, divisionId);

  const updates: {
    name?: string;
    email?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.email !== undefined) {
    const email = input.email.toLowerCase();

    const [existingUser] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          ne(users.id, memberId)
        )
      )
      .limit(1);

    if (existingUser) {
      throw new MemberServiceError(
        "Email sudah digunakan oleh pengguna lain.",
        409
      );
    }

    updates.email = email;
  }

  try {
    await db
      .update(users)
      .set(updates)
      .where(
        and(
          eq(users.id, memberId),
          eq(users.divisionId, divisionId),
          eq(users.role, "member")
        )
      );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new MemberServiceError(
        "Email sudah digunakan oleh pengguna lain.",
        409
      );
    }

    throw error;
  }

  return getScopedMember(memberId, divisionId);
}

export async function updateMemberStatus(
  user: AuthenticatedUser,
  memberId: string,
  isActive: boolean
) {
  const divisionId = getDivisionId(user);

  await ensureActiveDivision(divisionId);
  await getScopedMember(memberId, divisionId);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, memberId),
          eq(users.divisionId, divisionId),
          eq(users.role, "member")
        )
      );

    if (!isActive) {
      await tx
        .delete(sessions)
        .where(eq(sessions.userId, memberId));
    }
  });

  return getScopedMember(memberId, divisionId);
}