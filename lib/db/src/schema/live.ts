import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";

export const liveStateTable = pgTable("live_state", {
  id: integer("id").primaryKey(),
  override: text("override"),
  overrideFino: timestamp("override_fino", { withTimezone: true }),
  aggiornato: timestamp("aggiornato", { withTimezone: true }).notNull().defaultNow(),
});

export const programmaTable = pgTable("programma", {
  id: serial("id").primaryKey(),
  giorno: integer("giorno").notNull(),
  inizio: text("inizio").notNull(),
  fine: text("fine").notNull(),
  attivita: text("attivita").notNull(),
}, (table) => [unique("programma_slot_unique").on(table.giorno, table.inizio)]);
