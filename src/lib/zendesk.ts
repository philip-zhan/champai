import createClient from "openapi-fetch";
import { paths } from "@/lib/zendesk-schema";

const zendeskClient = createClient<paths>({
  baseUrl: process.env.ZENDESK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.ZENDESK_TOKEN}`,
  },
});

export async function getTickets(startTime: number) {
  const { data, error } = await zendeskClient.GET(
    "/api/v2/incremental/tickets/cursor",
    {
      params: {
        query: {
          start_time: startTime,
        },
      },
    }
  );

  if (error) {
    console.error(error);
  }
  return data;
}

export async function getTicketEvents(startTime: number) {
  const { data, error } = await zendeskClient.GET(
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
  if (error) {
    console.error(error);
  }
  return data;
}
