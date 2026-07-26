import { pgTable, serial, text, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articoliTable = pgTable("articoli", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titolo: text("titolo").notNull(),
  categoria: text("categoria").notNull().default("Generale"),
  contenuto: text("contenuto").notNull().default(""),
  immagine: text("immagine"),
  pubblicato: boolean("pubblicato").notNull().default(false),
  data: date("data", { mode: "string" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArticoloSchema = createInsertSchema(articoliTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateArticoloSchema = insertArticoloSchema.partial();

export type InsertArticolo = z.infer<typeof insertArticoloSchema>;
export type UpdateArticolo = z.infer<typeof updateArticoloSchema>;
export type Articolo = typeof articoliTable.$inferSelect;
