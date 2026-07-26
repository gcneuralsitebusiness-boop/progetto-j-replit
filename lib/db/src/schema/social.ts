import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const socialTable = pgTable("social", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  url: text("url").notNull(),
  icona: text("icona").notNull().default("Instagram"),
  descrizione: text("descrizione").notNull().default(""),
  ordine: integer("ordine").notNull().default(0),
  visibile: boolean("visibile").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSocialSchema = createInsertSchema(socialTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSocialSchema = insertSocialSchema.partial();

export type InsertSocial = z.infer<typeof insertSocialSchema>;
export type UpdateSocial = z.infer<typeof updateSocialSchema>;
export type Social = typeof socialTable.$inferSelect;
