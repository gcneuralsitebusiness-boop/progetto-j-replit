import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pagineTable = pgTable("pagine", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titolo: text("titolo").notNull(),
  contenuto: text("contenuto").notNull().default(""),
  pubblicata: boolean("pubblicata").notNull().default(false),
  ordine: integer("ordine").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaginaSchema = createInsertSchema(pagineTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPagina = z.infer<typeof insertPaginaSchema>;
export type Pagina = typeof pagineTable.$inferSelect;
