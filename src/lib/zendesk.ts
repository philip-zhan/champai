import createClient from "openapi-fetch";
import { paths } from "@/lib/zendesk-schema";

const zendeskClient = createClient<paths>({
  baseUrl: process.env.ZENDESK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.ZENDESK_TOKEN}`,
  },
});

export async function getTickets() {
  const lookBackWindow = 1000 * 60 * 60 * 24 * 30; // 30 days

  const { data, error } = await zendeskClient.GET(
    "/api/v2/incremental/tickets/cursor",
    {
      params: {
        query: {
          start_time: Math.floor(Date.now() / 1000) - lookBackWindow,
        },
      },
    }
  );

  if (error) {
    console.error(error);
  }
  return data;
}
