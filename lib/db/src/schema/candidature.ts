import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatureTable = pgTable("candidature", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  contatto: text("contatto").notNull(),
  progetto: text("progetto").notNull(),
  stato: text("stato").notNull().default("nuova"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCandidaturaSchema = createInsertSchema(candidatureTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCandidatura = z.infer<typeof insertCandidaturaSchema>;
export type Candidatura = typeof candidatureTable.$inferSelect;
