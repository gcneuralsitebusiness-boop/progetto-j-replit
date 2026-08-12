import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const TASK_TIPI = ["POST", "ARTICOLO", "DIARIO", "VIDEO", "SITO", "ALTRO"] as const;
export const TASK_STATI = ["DA FARE", "IN CORSO", "FATTO"] as const;

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  data: date("data", { mode: "string" }).notNull(),
  testo: text("testo").notNull(),
  tipo: text("tipo").notNull().default("ALTRO"),
  stato: text("stato").notNull().default("DA FARE"),
  priorita: integer("priorita").notNull().default(2), // 1=alta, 2=media, 3=bassa
  ordine: integer("ordine").notNull().default(0), // manual drag order within a day (0 = not manually ordered)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskTemplatesTable = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  testo: text("testo").notNull(),
  tipo: text("tipo").notNull().default("ALTRO"),
  priorita: integer("priorita").notNull().default(2),
  ordine: integer("ordine").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  testo: z.string().min(1).max(500),
  tipo: z.enum(TASK_TIPI).default("ALTRO"),
  stato: z.enum(TASK_STATI).default("DA FARE"),
  priorita: z.number().int().min(1).max(3).default(2),
});

export const insertTaskTemplateSchema = z.object({
  testo: z.string().min(1).max(500),
  tipo: z.enum(TASK_TIPI).default("ALTRO"),
  priorita: z.number().int().min(1).max(3).default(2),
});

export type Task = typeof tasksTable.$inferSelect;
export type TaskTemplate = typeof taskTemplatesTable.$inferSelect;
