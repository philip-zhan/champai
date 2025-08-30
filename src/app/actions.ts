"use server";

import { getTickets, getTicketEvents } from "@/lib/zendesk";
import { upsertTicketsByZendeskId } from "@/db/crud/tickets";
import { upsertTicketComments } from "@/db/crud/ticketComments";
import { components } from "@/lib/zendesk-schema";

export async function syncTicketsAction() {
  const startTime = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30; // 30 days

  try {
    console.log("Starting Zendesk sync...");

    // Check for rate limiting before starting sync
    const ticketsData = await getTickets(startTime);
    if (ticketsData.retryAfter) {
      console.log(
        `Rate limited. Retry after ${ticketsData.retryAfter} seconds`
      );
      return {
        success: false,
        rateLimited: true,
        waitTime: ticketsData.retryAfter,
      };
    }

    const eventsData = await getTicketEvents(startTime);
    if (eventsData.retryAfter) {
      console.log(`Rate limited. Retry after ${eventsData.retryAfter} seconds`);
      return {
        success: false,
        rateLimited: true,
        waitTime: eventsData.retryAfter,
      };
    }

    // Proceed with sync if not rate limited
    await Promise.all([
      syncTickets(ticketsData.tickets!),
      syncTicketEvents(eventsData.ticketEvents!),
    ]);

    console.log("Zendesk sync completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Zendesk sync failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function syncTickets(tickets: components["schemas"]["TicketObject"][]) {
  console.log("Tickets fetched:", tickets.length);

  const dbPayload = tickets.map(
    (ticket: components["schemas"]["TicketObject"]) => ({
      zendesk_id: ticket.id!,
      raw: ticket,
      url: ticket.url,
      via_channel: ticket.via?.channel,
      zendesk_created_at: ticket.created_at
        ? new Date(ticket.created_at)
        : null,
      zendesk_updated_at: ticket.updated_at
        ? new Date(ticket.updated_at)
        : null,
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
    })
  );

  await upsertTicketsByZendeskId(dbPayload);
  console.log("Tickets synced:", dbPayload.length);
}

async function syncTicketEvents(
  ticketEvents: components["schemas"]["TicketMetricEventBaseObject"][]
) {
  console.log("Ticket events fetched:", ticketEvents.length);

  const commentEvents = ticketEvents.filter(
    (event: components["schemas"]["TicketMetricEventBaseObject"]) =>
      event.child_events.some(
        (child: { type: string }) => child.type === "Comment"
      )
  );
  const dbPayload = commentEvents.map(
    (event: components["schemas"]["TicketMetricEventBaseObject"]) => {
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
        author_id: childCommentEvent.author_id,
      };
    }
  );

  await upsertTicketComments(dbPayload);
  console.log("Ticket comments synced:", dbPayload.length);
}
