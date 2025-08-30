import { NextRequest, NextResponse } from "next/server";
import { getTicketsPaginated } from "@/db/crud/tickets";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid page or limit parameters" },
        { status: 400 }
      );
    }

    const result = await getTicketsPaginated(page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
} 
