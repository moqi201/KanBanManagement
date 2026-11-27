
import { sql } from "drizzle-orm";

import {
  mysqlTable,
  varchar,
  text,
  date,
  datetime,
  mysqlEnum,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/mysql-core";

import { divisions } from "./divisions";
import { users } from "./users";

export const tasks = mysqlTable(
  "tasks",
  {
    // Primary Key
    id: varchar("id", { length: 36 }).primaryKey(),

    // Relasi divisi
    divisionId: varchar("division_id", { length: 36 })
      .notNull()
      .references(() => divisions.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    // Pembuat task
    createdBy: varchar("created_by", { length: 36 })
      .notNull(),

    // Informasi task
    title: varchar("title", { length: 160 }).notNull(),

    description: text("description"),

    // Status pekerjaan
    status: mysqlEnum("status", [
      "todo",
      "in_progress",
      "done",
    ])
      .notNull()
      .default("todo"),

    // Prioritas pekerjaan
    priority: mysqlEnum("priority", [
      "low",
      "medium",
      "high",
    ])
      .notNull()
      .default("medium"),

    // Tenggat waktu
    dueDate: date("due_date", {
      mode: "string",
    }),

    // Timestamp
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
  .notNull()
  .default(sql`CURRENT_TIMESTAMP`)
  .$onUpdateFn(() => new Date()),
  },

  (table) => [
    // Unik untuk kebutuhan composite foreign key
    uniqueIndex("tasks_id_division_unique").on(
      table.id,
      table.divisionId
    ),

    // Memastikan pembuat task berasal dari divisi yang sama
    foreignKey({
      columns: [table.createdBy, table.divisionId],
      foreignColumns: [users.id, users.divisionId],
      name: "tasks_creator_division_fk",
    }).onDelete("restrict").onUpdate("cascade"),

    // Index berdasarkan divisi dan status
    index("tasks_division_status_idx").on(
      table.divisionId,
      table.status
    ),

    // Index prioritas
    index("tasks_division_priority_idx").on(
      table.divisionId,
      table.priority
    ),

    // Index waktu pembuatan
    index("tasks_division_created_at_idx").on(
      table.divisionId,
      table.createdAt
    ),

    // Index pembuat task
    index("tasks_division_creator_idx").on(
      table.divisionId,
      table.createdBy
    ),
  ]
);

// Type untuk mengambil task
export type Task = typeof tasks.$inferSelect;

// Type untuk memasukkan task baru
export type NewTask = typeof tasks.$inferInsert;
