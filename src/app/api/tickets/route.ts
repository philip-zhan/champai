import { NextRequest, NextResponse } from "next/server";
import { getTicketsPaginated } from "@/db/crud/tickets";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "zendesk_updated_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
