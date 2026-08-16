import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";

export const plannerNotesTable = pgTable("planner_notes", {
  id: serial("id").primaryKey(),
  data: date("data", { mode: "string" }),
  tipo: text("tipo").notNull().default("daily"),
  testo: text("testo").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlannerNote = typeof plannerNotesTable.$inferSelect;