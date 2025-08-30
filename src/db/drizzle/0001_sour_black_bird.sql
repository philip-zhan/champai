CREATE TABLE "ticket_comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ticket_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"raw" jsonb NOT NULL,
	"zendesk_ticket_id" bigint NOT NULL,
	"zendesk_event_id" bigint NOT NULL,
	"zendesk_child_event_id" bigint NOT NULL,
	"via_channel" text,
	"body" text NOT NULL,
	"html_body" text NOT NULL,
	"plain_body" text NOT NULL,
	"zendesk_created_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "ticket_comments_zendesk_child_event_id_unique" UNIQUE("zendesk_child_event_id")
);
