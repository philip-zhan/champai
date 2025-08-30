import createClient from "openapi-fetch";
import { paths } from "@/lib/zendesk-schema";

const zendeskClient = createClient<paths>({
  baseUrl: process.env.ZENDESK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.ZENDESK_TOKEN}`,
  },
});

export async function getTickets(startTime: number) {
  const { data, error, response } = await zendeskClient.GET(
    "/api/v2/incremental/tickets/cursor",
    {
      params: {
        query: {
          start_time: startTime,
        },
      },
    }
  );

  // example total=10; remaining=7; resets=43
  const rateLimitHeader = response?.headers.get(
    "zendesk-ratelimit-incremental-exports"
  );
  const { remaining, resets } = parseRateLimitHeader(rateLimitHeader)!;
  if (remaining === 0) {
    console.warn("Rate limit reached");
    return { tickets: null, retryAfter: resets };
  }

  if (error) {
    console.error("Zendesk API error:", error);
    throw error;
  }

  return { tickets: data.tickets, retryAfter: null };
}

function parseRateLimitHeader(rateLimitHeader: string | null) {
  console.log("Rate limit header:", rateLimitHeader);
  if (!rateLimitHeader) {
    console.warn("Rate limit header not found");
    return null;
  }
  const parts = rateLimitHeader.split(";");
  if (parts.length !== 3) {
    console.warn("Rate limit header parts not found");
    return null;
  }
  const total = parts[0]!.split("=")[1]!;
  const remaining = parts[1]!.split("=")[1]!;
  const resets = parts[2]!.split("=")[1]!;
  return {
    total: parseInt(total),
    remaining: parseInt(remaining),
    resets: parseInt(resets),
  };
}

export async function getTicketEvents(startTime: number) {
  const { data, error, response } = await zendeskClient.GET(
    `/api/v2/incremental/ticket_events`,
    {
      params: {
        query: {
          start_time: startTime,
          include: "comment_events",
        },
      },
    }
  );

  const rateLimitHeader = response?.headers.get(
    "zendesk-ratelimit-incremental-exports"
  );
  const { remaining, resets } = parseRateLimitHeader(rateLimitHeader)!;
  if (remaining === 0) {
    console.warn("Rate limit reached");
    return { ticketEvents: null, retryAfter: resets };
  }

  if (error) {
    console.error("Zendesk API error:", error);
    throw error;
  }

  return { ticketEvents: data.ticket_events, retryAfter: null };
}
