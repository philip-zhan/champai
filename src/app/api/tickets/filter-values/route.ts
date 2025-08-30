import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema/tickets";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all unique priority values
    const priorityResult = await db
      .selectDistinct({ priority: tickets.priority })
      .from(tickets)
      .where(sql`${tickets.priority} IS NOT NULL`);

    // Get all unique status values
    const statusResult = await db
      .selectDistinct({ status: tickets.status })
      .from(tickets)
      .where(sql`${tickets.status} IS NOT NULL`);

    // Get all unique channel values
    const channelResult = await db
      .selectDistinct({ channel: tickets.via_channel })
      .from(tickets)
      .where(sql`${tickets.via_channel} IS NOT NULL`);

    // Extract the values and filter out nulls
    const priorities = priorityResult
      .map(row => row.priority)
      .filter((priority): priority is string => priority !== null)
      .sort();

    const statuses = statusResult
      .map(row => row.status)
      .filter((status): status is string => status !== null)
      .sort();

    const channels = channelResult
      .map(row => row.channel)
      .filter((channel): channel is string => channel !== null)
      .sort();

    return NextResponse.json({
      priorities,
      statuses,
      channels,
    });
  } catch (error) {
    console.error("Error fetching filter values:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter values" },
      { status: 500 }
    );
  }
}
