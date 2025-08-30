import { db } from "@/db";
import { ticketComments } from "@/db/schema/ticketComments";
import { InferInsertModel, sql } from "drizzle-orm";

export async function upsertTicketComments(
  payload: InferInsertModel<typeof ticketComments>[]
) {
  const result = await db
    .insert(ticketComments)
    .values(payload)
    .onConflictDoUpdate({
      target: [ticketComments.zendesk_child_event_id],
      set: {
        raw: sql`EXCLUDED.raw`,
        zendesk_ticket_id: sql`EXCLUDED.zendesk_ticket_id`,
        zendesk_event_id: sql`EXCLUDED.zendesk_event_id`,
        zendesk_child_event_id: sql`EXCLUDED.zendesk_child_event_id`,
        via_channel: sql`EXCLUDED.via_channel`,
        body: sql`EXCLUDED.body`,
        html_body: sql`EXCLUDED.html_body`,
        plain_body: sql`EXCLUDED.plain_body`,
        zendesk_created_at: sql`EXCLUDED.zendesk_created_at`,
        author_id: sql`EXCLUDED.author_id`,
      },
    });
  return result;
}
