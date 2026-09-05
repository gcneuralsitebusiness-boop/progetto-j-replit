import { boolean, integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tappeTable = pgTable("tappe", {
  id: serial("id").primaryKey(),
  ciclo: integer("ciclo").notNull().default(1),
  numero: integer("numero").notNull(),
  giornoInizio: integer("giorno_inizio").notNull(),
  giornoFine: integer("giorno_fine").notNull(),
  chiusa: boolean("chiusa").notNull().default(false),
  nota: text("nota"),
}, (table) => [unique("tappe_ciclo_numero_unique").on(table.ciclo, table.numero)]);

export const insertTappaSchema = createInsertSchema(tappeTable).omit({ id: true }).extend({
  ciclo: z.number().int().positive().default(1),
  numero: z.number().int().positive(),
  giornoInizio: z.number().int().positive(),
  giornoFine: z.number().int().positive(),
  chiusa: z.boolean().default(false),
});

export type InsertTappa = z.infer<typeof insertTappaSchema>;
export type Tappa = typeof tappeTable.$inferSelect;