"use server";

import { getTickets, getTicketEvents } from "@/lib/zendesk";
import { upsertTicketsByZendeskId } from "@/db/crud/tickets";
import { insertTicketComments } from "@/db/crud/ticketComments";

export async function syncTicketsAction() {
  const startTime = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30; // 30 days
  syncTickets(startTime);
  syncTicketEvents(startTime);
}

async function syncTickets(startTime: number) {
  console.log("Starting sync from Zendesk...");
  const data = await getTickets(startTime);

  if (!data.tickets) {
    console.error("No tickets found");
    return;
  }
  console.log("Tickets fetched:", data.tickets?.length);

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
    tags: ticket.tags,
    assignee_id: ticket.assignee_id,
    submitter_id: ticket.submitter_id,
    requester_id: ticket.requester_id,
    organization_id: ticket.organization_id,
    group_id: ticket.group_id,
    collaborator_ids: ticket.collaborator_ids,
    follower_ids: ticket.follower_ids,
  }));

  await upsertTicketsByZendeskId(dbPayload);
  console.log("Tickets synced:", dbPayload.length);
}

async function syncTicketEvents(startTime: number) {
  const data = await getTicketEvents(startTime);
  if (!data.ticket_events) {
    console.error("No ticket events found");
    return;
  }
  console.log("Ticket events fetched:", data.ticket_events?.length);

  const commentEvents = data.ticket_events.filter((event) =>
    event.child_events.some(
      (child: { type: string }) => child.type === "Comment"
    )
  );
  const dbPayload = commentEvents.map((event) => {
    const childCommentEvent = event.child_events.find(
      (child: { type: string }) => child.type === "Comment"
    );
    return {
      raw: childCommentEvent,
      zendesk_ticket_id: event.ticket_id!,
      zendesk_event_id: event.id!,
      zendesk_child_event_id: childCommentEvent.id,
      via_channel: childCommentEvent.via.channel,
      body: childCommentEvent.body,
      html_body: childCommentEvent.html_body,
      plain_body: childCommentEvent.plain_body,
      zendesk_created_at: childCommentEvent.created_at
        ? new Date(childCommentEvent.created_at)
        : null,
    };
  });

  await insertTicketComments(dbPayload);
  console.log("Ticket comments synced:", dbPayload.length);
}
