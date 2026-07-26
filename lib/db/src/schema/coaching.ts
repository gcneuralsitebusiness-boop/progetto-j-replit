import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coachingTable = pgTable("coaching", {
  id: serial("id").primaryKey(),
  heroTitolo: text("hero_titolo").notNull().default("PROTOCOLLO COACHING"),
  heroSottotitolo: text("hero_sottotitolo").notNull().default("Dimagrimento. Disciplina. Dati."),
  descrizione: text("descrizione").notNull().default(""),
  communityCta: text("community_cta").notNull().default("Entra nella community italiana e trova gente con la tua stessa fame."),
  communityUrl: text("community_url").notNull().default("#"),
  email: text("email").notNull().default("contatto@progettoj.it"),
  visibile: boolean("visibile").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCoachingSchema = createInsertSchema(coachingTable).omit({
  id: true,
  updatedAt: true,
});

export const updateCoachingSchema = insertCoachingSchema.partial();

export type InsertCoaching = z.infer<typeof insertCoachingSchema>;
export type UpdateCoaching = z.infer<typeof updateCoachingSchema>;
export type Coaching = typeof coachingTable.$inferSelect;
