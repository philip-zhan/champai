import createClient from "openapi-fetch";
import { paths, components } from "@/lib/zendesk-schema";

// Interface for pagination response
interface PaginationResponse {
  tickets?: components["schemas"]["TicketObject"][];
  ticket_events?: components["schemas"]["TicketMetricEventBaseObject"][];
  end_of_stream?: boolean;
  after_url?: string;
}

// Interface for rate limit information
interface RateLimitInfo {
  total: number;
  remaining: number;
  resets: number;
}

const zendeskClient = createClient<paths>({
  baseUrl: process.env.ZENDESK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.ZENDESK_TOKEN}`,
  },
});

export async function getTickets(startTime: number) {
  // Initial request
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

  // Check rate limiting for initial request
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

  // Fetch all pages using the reusable function
  return await fetchAllPages(data as PaginationResponse);
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
  // Initial request
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

  // Check rate limiting for initial request
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

  // Fetch all pages using the reusable function
  return await fetchAllTicketEventsPages(data as PaginationResponse);
}

/**
 * Fetches a single page of data from a URL
 */
async function fetchPage(
  url: string
): Promise<{ data: PaginationResponse; rateLimitInfo: RateLimitInfo | null }> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.ZENDESK_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status} - ${response.statusText}`
    );
  }

  const data: PaginationResponse = await response.json();
  const rateLimitHeader = response.headers.get(
    "zendesk-ratelimit-incremental-exports"
  );
  const rateLimitInfo = parseRateLimitHeader(rateLimitHeader);

  return { data, rateLimitInfo };
}

/**
 * Checks if rate limit is exceeded and returns retry information
 */
function checkRateLimit(rateLimitInfo: RateLimitInfo | null): {
  shouldRetry: boolean;
  retryAfter: number | null;
} {
  if (!rateLimitInfo) {
    return { shouldRetry: false, retryAfter: null };
  }

  if (rateLimitInfo.remaining === 0) {
    console.warn("Rate limit reached during pagination");
    return { shouldRetry: true, retryAfter: rateLimitInfo.resets };
  }

  return { shouldRetry: false, retryAfter: null };
}

/**
 * Fetches all pages of data using pagination
 */
async function fetchAllPages(
  initialData: PaginationResponse
): Promise<{
  tickets: components["schemas"]["TicketObject"][];
  retryAfter: number | null;
}> {
  const allTickets: components["schemas"]["TicketObject"][] = [];
  let currentUrl: string | null = null;
  let isEndOfStream = false;

  // Add tickets from first page
  if (initialData.tickets) {
    allTickets.push(...initialData.tickets);
  }

  // Check if we need to fetch more pages
  isEndOfStream = initialData.end_of_stream || false;
  currentUrl = initialData.after_url || null;

  // Continue fetching pages until end_of_stream is true
  while (!isEndOfStream && currentUrl) {
    console.log(
      `Fetching next page of tickets. Current total: ${allTickets.length}`
    );

    try {
      const { data: nextPageData, rateLimitInfo } = await fetchPage(currentUrl);

      // Check rate limiting for subsequent requests
      const rateLimitCheck = checkRateLimit(rateLimitInfo);
      if (rateLimitCheck.shouldRetry) {
        console.warn("Rate limit reached during pagination");
        return { tickets: allTickets, retryAfter: rateLimitCheck.retryAfter };
      }

      if (nextPageData?.tickets) {
        allTickets.push(...nextPageData.tickets);
      }

      // Update pagination state
      isEndOfStream = nextPageData?.end_of_stream || false;
      currentUrl = nextPageData?.after_url || null;
    } catch (pageError) {
      console.error("Error fetching next page:", pageError);
      break;
    }
  }

  console.log(`Total tickets fetched: ${allTickets.length}`);
  return { tickets: allTickets, retryAfter: null };
}

/**
 * Fetches all pages of ticket events using pagination
 */
async function fetchAllTicketEventsPages(
  initialData: PaginationResponse
): Promise<{
  ticketEvents: components["schemas"]["TicketMetricEventBaseObject"][];
  retryAfter: number | null;
}> {
  const allTicketEvents: components["schemas"]["TicketMetricEventBaseObject"][] = [];
  let currentUrl: string | null = null;
  let isEndOfStream = false;

  // Add ticket events from first page
  if (initialData.ticket_events) {
    allTicketEvents.push(...initialData.ticket_events);
  }

  // Check if we need to fetch more pages
  isEndOfStream = initialData.end_of_stream || false;
  currentUrl = initialData.after_url || null;

  // Continue fetching pages until end_of_stream is true
  while (!isEndOfStream && currentUrl) {
    console.log(
      `Fetching next page of ticket events. Current total: ${allTicketEvents.length}`
    );

    try {
      const { data: nextPageData, rateLimitInfo } = await fetchPage(currentUrl);

      // Check rate limiting for subsequent requests
      const rateLimitCheck = checkRateLimit(rateLimitInfo);
      if (rateLimitCheck.shouldRetry) {
        console.warn("Rate limit reached during pagination");
        return { ticketEvents: allTicketEvents, retryAfter: rateLimitCheck.retryAfter };
      }

      if (nextPageData?.ticket_events) {
        allTicketEvents.push(...nextPageData.ticket_events);
      }

      // Update pagination state
      isEndOfStream = nextPageData?.end_of_stream || false;
      currentUrl = nextPageData?.after_url || null;
    } catch (pageError) {
      console.error("Error fetching next page:", pageError);
      break;
    }
  }

  console.log(`Total ticket events fetched: ${allTicketEvents.length}`);
  return { ticketEvents: allTicketEvents, retryAfter: null };
}
