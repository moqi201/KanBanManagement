
import { sql } from "drizzle-orm";

import {
  mysqlTable,
  varchar,
  datetime,
  primaryKey,
  foreignKey,
  index,
} from "drizzle-orm/mysql-core";

import { tasks } from "./tasks";
import { users } from "./users";

export const taskAssignees = mysqlTable(
  "task_assignees",
  {
    // Relasi ke tabel tasks
    taskId: varchar("task_id", { length: 36 }).notNull(),

    // Relasi ke tabel users
    userId: varchar("user_id", { length: 36 }).notNull(),

    // Memastikan assignee berasal dari divisi yang sama
    divisionId: varchar("division_id", { length: 36 }).notNull(),

    // Waktu penugasan
    assignedAt: datetime("assigned_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },

  (table) => [
    // Primary Key Gabungan
    primaryKey({
      columns: [table.taskId, table.userId],
      name: "task_assignees_pk",
    }),

    // Task dan divisi harus cocok
    foreignKey({
      columns: [table.taskId, table.divisionId],
      foreignColumns: [tasks.id, tasks.divisionId],
      name: "task_assignees_task_division_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    // User dan divisi harus cocok
    foreignKey({
      columns: [table.userId, table.divisionId],
      foreignColumns: [users.id, users.divisionId],
      name: "task_assignees_user_division_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    // Index pencarian berdasarkan task
    index("task_assignees_task_division_idx").on(
      table.taskId,
      table.divisionId
    ),

    // Index pencarian berdasarkan user
    index("task_assignees_user_division_idx").on(
      table.userId,
      table.divisionId
    ),
  ]
);

// Type untuk mengambil data assignee
export type TaskAssignee = typeof taskAssignees.$inferSelect;

// Type untuk memasukkan assignee
export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
