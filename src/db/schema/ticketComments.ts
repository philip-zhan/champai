import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_timestamps";
import { relations } from "drizzle-orm";
import { tickets } from "./tickets";

export const ticketComments = pgTable("ticket_comments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  raw: jsonb().notNull(),
  zendesk_ticket_id: bigint({ mode: "number" }).notNull(),
  zendesk_event_id: bigint({ mode: "number" }).notNull(),
  zendesk_child_event_id: bigint({ mode: "number" }).notNull().unique(),
  via_channel: text(),
  body: text().notNull(),
  html_body: text().notNull(),
  plain_body: text().notNull(),
  zendesk_created_at: timestamp(),
  ...timestamps,
});

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.zendesk_ticket_id],
    references: [tickets.zendesk_id],
  }),
}));
