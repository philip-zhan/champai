"use server";

import { getTickets } from "@/lib/zendesk";
import { upsertTicketsByZendeskId } from "@/db/crud/tickets";

export async function syncTicketsAction() {
  console.log("Starting sync from Zendesk...");
  const data = await getTickets();
  console.log("Sync completed:", data);

  if (!data.tickets) {
    console.error("No tickets found");
    return;
  }

  const dbPayload = data.tickets.map((ticket) => ({
    zendesk_id: ticket.id!,
    raw: ticket,
    url: ticket.url,
    via_channel: ticket.via?.channel,
    zendesk_created_at: ticket.created_at ? new Date(ticket.created_at) : null,
    zendesk_updated_at: ticket.updated_at ? new Date(ticket.updated_at) : null,
    subject: ticket.subject,
    raw_subject: ticket.raw_subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    is_public: ticket.is_public,
  }));

  await upsertTicketsByZendeskId(dbPayload);
}
