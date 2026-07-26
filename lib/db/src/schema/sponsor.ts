import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sponsorLevels = ["Bronze", "Silver", "Gold", "Blood"] as const;

export const sponsorTable = pgTable("sponsor", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descrizione: text("descrizione").notNull().default(""),
  url: text("url").notNull().default(""),
  logo: text("logo"),
  livello: text("livello").notNull().default("Bronze"),
  ordine: integer("ordine").notNull().default(0),
  visibile: boolean("visibile").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSponsorSchema = createInsertSchema(sponsorTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSponsorSchema = insertSponsorSchema.partial();

export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type UpdateSponsor = z.infer<typeof updateSponsorSchema>;
export type Sponsor = typeof sponsorTable.$inferSelect;
