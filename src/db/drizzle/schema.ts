import { pgTable, unique, integer, jsonb, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tickets = pgTable("tickets", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "tickets_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	zendeskId: integer("zendesk_id").notNull(),
	raw: jsonb().notNull(),
	url: text(),
	viaChannel: text("via_channel"),
	zendeskCreatedAt: timestamp("zendesk_created_at", { mode: 'string' }),
	zendeskUpdatedAt: timestamp("zendesk_updated_at", { mode: 'string' }),
	subject: text(),
	rawSubject: text("raw_subject"),
	description: text(),
	status: text(),
	priority: text(),
	isPublic: boolean("is_public"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("tickets_zendesk_id_unique").on(table.zendeskId),
]);

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
});
