import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_timestamps";

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
