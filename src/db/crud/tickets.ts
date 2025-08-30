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
        ...tickets,
      },
    });
  return result;
}
