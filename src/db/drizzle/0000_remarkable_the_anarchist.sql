CREATE TABLE "tickets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tickets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"zendesk_id" integer NOT NULL,
	"raw" jsonb NOT NULL,
	"url" text,
	"via_channel" text,
	"zendesk_created_at" timestamp,
	"zendesk_updated_at" timestamp,
	"subject" text,
	"raw_subject" text,
	"description" text,
	"status" text,
	"priority" text,
	"is_public" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tickets_zendesk_id_unique" UNIQUE("zendesk_id")
);
