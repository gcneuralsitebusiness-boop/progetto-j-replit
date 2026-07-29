import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const iscrittiTable = pgTable("iscritti", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Iscritto = typeof iscrittiTable.$inferSelect;