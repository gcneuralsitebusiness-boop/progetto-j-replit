import { pgTable, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const bozzeTable = pgTable("bozze", {
  numero: integer("numero").primaryKey(),
  dati: jsonb("dati").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Bozza = typeof bozzeTable.$inferSelect;
