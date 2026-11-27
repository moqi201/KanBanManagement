
import { createHash, randomBytes, randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { divisions, sessions, users } from "../../db/schema";

export const SESSION_COOKIE_NAME = "kanban_session";

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

type AuthErrorStatus = 401 | 403;

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public status: AuthErrorStatus
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function loginWithCredentials(
  email: string,
  password: string
) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
      divisionId: users.divisionId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AuthServiceError(
      "Email atau password salah.",
      401
    );
  }

  let passwordValid = false;

  try {
    passwordValid = await argon2.verify(
      user.passwordHash,
      password
    );
  } catch {
    passwordValid = false;
  }

  if (!passwordValid || !Boolean(user.isActive)) {
    throw new AuthServiceError(
      "Email atau password salah.",
      401
    );
  }

  let division = null;

  if (user.role !== "platform_admin") {
    if (!user.divisionId) {
      throw new AuthServiceError(
        "Akun tidak memiliki divisi.",
        403
      );
    }

    const [foundDivision] = await db
      .select({
        id: divisions.id,
        name: divisions.name,
        slug: divisions.slug,
        isActive: divisions.isActive,
      })
      .from(divisions)
      .where(eq(divisions.id, user.divisionId))
      .limit(1);

    if (!foundDivision || !Boolean(foundDivision.isActive)) {
      throw new AuthServiceError(
        "Divisi tidak aktif. Silakan hubungi administrator.",
        403
      );
    }

    division = {
      id: foundDivision.id,
      name: foundDivision.name,
      slug: foundDivision.slug,
    };
  }

  const token = randomBytes(32).toString("base64url");

  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1000
  );

  await db.insert(sessions).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      divisionId: user.divisionId,
      division,
    },
  };
}

export async function resolveSession(token: string) {
  const tokenHash = hashSessionToken(token);

  const [session] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,

      userId: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      divisionId: users.divisionId,
      userIsActive: users.isActive,

      divisionRecordId: divisions.id,
      divisionName: divisions.name,
      divisionSlug: divisions.slug,
      divisionIsActive: divisions.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(divisions, eq(users.divisionId, divisions.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!session) {
    return null;
  }

  const expired = session.expiresAt.getTime() <= Date.now();

  const invalidUser = !Boolean(session.userIsActive);

  const invalidDivision =
    session.role !== "platform_admin" &&
    (
      !session.divisionId ||
      !session.divisionRecordId ||
      !Boolean(session.divisionIsActive)
    );

  if (expired || invalidUser || invalidDivision) {
    await db
      .delete(sessions)
      .where(eq(sessions.id, session.sessionId));

    return null;
  }

  return {
    sessionId: session.sessionId,

    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      divisionId: session.divisionId,

      division:
        session.divisionRecordId &&
        session.divisionName &&
        session.divisionSlug
          ? {
              id: session.divisionRecordId,
              name: session.divisionName,
              slug: session.divisionSlug,
            }
          : null,
    },
  };
}

export async function revokeSession(token: string) {
  const tokenHash = hashSessionToken(token);

  await db
    .delete(sessions)
    .where(eq(sessions.tokenHash, tokenHash));
}
