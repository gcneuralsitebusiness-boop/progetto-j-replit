import { integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const OBIETTIVI_AREE = ["CORPO", "CONTENUTI", "SOLDI"] as const;
export const OBIETTIVI_STATI = ["attivo", "compiuto", "fallito"] as const;

export const obiettiviTable = pgTable("obiettivi", {
  id: serial("id").primaryKey(),
  ciclo: integer("ciclo").notNull().default(1),
  posizione: integer("posizione").notNull(),
  area: text("area").notNull(),
  titolo: text("titolo").notNull(),
  previsto: integer("previsto").notNull(),
  giornoLimite: integer("giorno_limite").notNull().default(180),
  prova: text("prova"),
  stato: text("stato").notNull().default("attivo"),
}, (table) => [unique("obiettivi_ciclo_posizione_unique").on(table.ciclo, table.posizione)]);

export const insertObiettivoSchema = createInsertSchema(obiettiviTable).omit({ id: true }).extend({
  ciclo: z.number().int().positive().default(1),
  posizione: z.number().int().min(1).max(3),
  area: z.enum(OBIETTIVI_AREE),
  titolo: z.string().trim().min(1).max(60),
  previsto: z.number().int().positive(),
  giornoLimite: z.number().int().positive().default(180),
  stato: z.enum(OBIETTIVI_STATI).default("attivo"),
});

export type InsertObiettivo = z.infer<typeof insertObiettivoSchema>;
export type Obiettivo = typeof obiettiviTable.$inferSelect;