
import { sql } from "drizzle-orm";

import {
  mysqlTable,
  varchar,
  datetime,
  boolean,
  mysqlEnum,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/mysql-core";

import { divisions } from "./divisions";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    // NULL hanya untuk Platform Admin
    divisionId: varchar("division_id", { length: 36 })
      .references(() => divisions.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),

    name: varchar("name", { length: 120 }).notNull(),

    email: varchar("email", { length: 191 }).notNull(),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    // Tiga tingkatan role
    role: mysqlEnum("role", [
      "platform_admin",
      "division_admin",
      "member",
    ])
      .notNull()
      .default("member"),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },

  (table) => [
    uniqueIndex("users_email_unique").on(table.email),

    // Digunakan untuk composite foreign key
    uniqueIndex("users_id_division_unique").on(
      table.id,
      table.divisionId
    ),

    index("users_division_idx").on(table.divisionId),

    index("users_division_role_active_idx").on(
      table.divisionId,
      table.role,
      table.isActive
    ),

    // Platform Admin tidak boleh memiliki divisi.
    // Division Admin dan Member wajib memiliki divisi.
    check(
      "users_role_division_check",
      sql`
        (
          ${table.role} = 'platform_admin'
          AND ${table.divisionId} IS NULL
        )
        OR
        (
          ${table.role} IN ('division_admin', 'member')
          AND ${table.divisionId} IS NOT NULL
        )
      `
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
