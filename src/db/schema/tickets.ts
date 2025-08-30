import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_timestamps";
import { relations } from "drizzle-orm";
import { ticketComments } from "./ticketComments";

export const tickets = pgTable("tickets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  zendesk_id: integer().notNull().unique(),
  raw: jsonb().notNull(),
  url: text(),
  via_channel: text(),
  zendesk_created_at: timestamp(),
  zendesk_updated_at: timestamp(),
  subject: text(),
  raw_subject: text(),
  description: text(),
  status: text(),
  priority: text(),
  is_public: boolean(),
  ...timestamps,
});

export const ticketsRelations = relations(tickets, ({ many }) => ({
  comments: many(ticketComments),
}));
