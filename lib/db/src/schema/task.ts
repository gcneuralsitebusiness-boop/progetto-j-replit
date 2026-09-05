import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { obiettiviTable } from "./obiettivi";
import { tappeTable } from "./tappe";

export const taskTable = pgTable("task", {
  id: serial("id").primaryKey(),
  obiettivoId: integer("obiettivo_id").notNull().references(() => obiettiviTable.id, { onDelete: "cascade" }),
  tappaId: integer("tappa_id").notNull().references(() => tappeTable.id, { onDelete: "cascade" }),
  testo: text("testo").notNull(),
  giornoCompletato: integer("giorno_completato"),
  saltato: boolean("saltato").notNull().default(false),
  ordine: integer("ordine").notNull().default(0),
});

export const insertTaskObiettivoSchema = createInsertSchema(taskTable).omit({ id: true }).extend({
  obiettivoId: z.number().int().positive(),
  tappaId: z.number().int().positive(),
  testo: z.string().trim().min(1).max(80),
  giornoCompletato: z.number().int().positive().nullable().optional(),
  saltato: z.boolean().default(false),
  ordine: z.number().int().min(0).default(0),
});

export type InsertTaskObiettivo = z.infer<typeof insertTaskObiettivoSchema>;
export type TaskObiettivo = typeof taskTable.$inferSelect;