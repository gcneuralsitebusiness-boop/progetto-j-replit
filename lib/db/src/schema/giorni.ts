import { pgTable, serial, integer, real, text, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const giorniTable = pgTable("giorni", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull().unique(),
  data: date("data", { mode: "string" }).notNull(),
  kcal: integer("kcal"),
  sonno: real("sonno"),
  flessioni: integer("flessioni"),
  addominali: integer("addominali"),
  round: integer("round"),
  km: real("km"),
  peso: real("peso"),
  battito: integer("battito"),
  entrate: real("entrate"),
  uscite: real("uscite"),
  testo: text("testo"),
  sintesi: text("sintesi"),
  foto: text("foto"),
  cardTitolo: text("card_titolo"),
  cardSottotitolo: text("card_sottotitolo"),
  cardImmagine: text("card_immagine"),
  cardOverlay: integer("card_overlay"),
  cardMostraParole: boolean("card_mostra_parole"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGiornoSchema = createInsertSchema(giorniTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGiorno = z.infer<typeof insertGiornoSchema>;
export type Giorno = typeof giorniTable.$inferSelect;
