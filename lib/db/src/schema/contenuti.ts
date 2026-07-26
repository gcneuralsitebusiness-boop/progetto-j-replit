import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contenutiTable = pgTable("contenuti", {
  chiave: text("chiave").primaryKey(),
  valore: text("valore").notNull(),
  aggiornatoA: timestamp("aggiornato_a", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContenutoSchema = createInsertSchema(contenutiTable);
export type InsertContenuto = z.infer<typeof insertContenutoSchema>;
export type Contenuto = typeof contenutiTable.$inferSelect;
