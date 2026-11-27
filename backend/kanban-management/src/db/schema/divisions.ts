
import { sql } from "drizzle-orm";

import {
  mysqlTable,
  varchar,
  datetime,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const divisions = mysqlTable(
  "divisions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    name: varchar("name", { length: 100 }).notNull(),

    slug: varchar("slug", { length: 100 }).notNull(),

    // Status aktif atau nonaktif
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
    uniqueIndex("divisions_slug_unique").on(table.slug),
  ]
);

export type Division = typeof divisions.$inferSelect;
export type NewDivision = typeof divisions.$inferInsert;
