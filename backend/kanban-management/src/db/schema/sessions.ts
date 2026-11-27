
import { sql } from "drizzle-orm";

import {
  mysqlTable,
  varchar,
  char,
  datetime,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

import { users } from "./users";

export const sessions = mysqlTable(
  "sessions",
  {
    // Primary Key
    id: varchar("id", { length: 36 }).primaryKey(),

    // Relasi ke pemilik session
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    // Hash token session SHA-256
    tokenHash: char("token_hash", { length: 64 }).notNull(),

    // Waktu kedaluwarsa session
    expiresAt: datetime("expires_at", { mode: "date" })
      .notNull(),

    // Waktu session dibuat
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },

  (table) => [
    // Token hash tidak boleh duplikat
    uniqueIndex("sessions_token_hash_unique").on(
      table.tokenHash
    ),

    // Index berdasarkan user
    index("sessions_user_idx").on(table.userId),

    // Index berdasarkan waktu kedaluwarsa
    index("sessions_expires_idx").on(table.expiresAt),
  ]
);

// Type untuk mengambil session
export type Session = typeof sessions.$inferSelect;

// Type untuk membuat session
export type NewSession = typeof sessions.$inferInsert;
