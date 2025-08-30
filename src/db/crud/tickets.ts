import { db } from "@/db";
import { tickets } from "@/db/schema/tickets";
import { InferInsertModel } from "drizzle-orm";

export async function upsertTicketsByZendeskId(
  payload: InferInsertModel<typeof tickets>[]
) {
  const result = await db
    .insert(tickets)
    .values(payload)
    .onConflictDoUpdate({
      target: [tickets.zendesk_id],
      set: {
        raw: tickets.raw,
        url: tickets.url,
        via_channel: tickets.via_channel,
        zendesk_created_at: tickets.zendesk_created_at,
        zendesk_updated_at: tickets.zendesk_updated_at,
        subject: tickets.subject,
        raw_subject: tickets.raw_subject,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        is_public: tickets.is_public,
        updated_at: tickets.updated_at,
      },
    });
  return result;
}
