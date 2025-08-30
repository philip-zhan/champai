import { NextRequest, NextResponse } from "next/server";
import { getTicketsPaginated } from "@/db/crud/tickets";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "zendesk_updated_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Get filter parameters
    const priorityFilters = searchParams.getAll("priority");
    const statusFilters = searchParams.getAll("status");
    const channelFilters = searchParams.getAll("channel");

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid page or limit parameters" },
        { status: 400 }
      );
    }

    if (
      ![
        "zendesk_created_at",
        "zendesk_updated_at",
        "subject",
        "priority",
        "status",
        "via_channel",
        "commentCount",
      ].includes(sortBy)
    ) {
      return NextResponse.json(
        { error: "Invalid sort field" },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return NextResponse.json(
        { error: "Invalid sort order" },
        { status: 400 }
      );
    }

    const result = await getTicketsPaginated(
      page,
      limit,
      sortBy,
      sortOrder as "asc" | "desc"
    );

    // Apply filters to the result
    let filteredTickets = result.tickets;

    if (priorityFilters.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.priority && priorityFilters.includes(ticket.priority)
      );
    }

    if (statusFilters.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.status && statusFilters.includes(ticket.status)
      );
    }

    if (channelFilters.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.via_channel && channelFilters.includes(ticket.via_channel)
      );
    }

    // Update total count and hasMore based on filtered results
    const filteredTotal = filteredTickets.length;
    const hasMore = (page - 1) * limit + filteredTickets.length < result.total;

    return NextResponse.json({
      tickets: filteredTickets,
      total: filteredTotal,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
