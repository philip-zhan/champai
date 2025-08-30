ALTER TABLE "tickets" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "submitter_id" bigint;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "requester_id" bigint;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assignee_id" bigint;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "organization_id" bigint;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "group_id" bigint;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "collaborator_ids" bigint[];--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "follower_ids" bigint[];