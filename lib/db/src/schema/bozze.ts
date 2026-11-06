import { pgTable, integer, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const bozzeTable = pgTable("bozze", {
  numero: integer("numero").notNull(),
  fase: integer("fase").notNull().default(1),
  dati: jsonb("dati").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.fase, table.numero] })]);

export type Bozza = typeof bozzeTable.$inferSelect;
