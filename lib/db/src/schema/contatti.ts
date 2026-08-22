import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contattiTable = pgTable("contatti", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  tipo: text("tipo").notNull(),
  messaggio: text("messaggio").notNull(),
  stato: text("stato").notNull().default("nuova"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContattoSchema = createInsertSchema(contattiTable).omit({
  id: true,
  createdAt: true,
});

export type InsertContatto = z.infer<typeof insertContattoSchema>;
export type Contatto = typeof contattiTable.$inferSelect;
