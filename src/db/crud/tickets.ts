import { db } from "@/db";
import { tickets } from "@/db/schema/tickets";
import { sql, asc, desc } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export async function upsertTicketsByZendeskId(
  payload: InferInsertModel<typeof tickets>[]
) {
  const result = await db
    .insert(tickets)
    .values(payload)
    .onConflictDoUpdate({
      target: [tickets.zendesk_id],
      set: {
        raw: sql`EXCLUDED.raw`,
        url: sql`EXCLUDED.url`,
        via_channel: sql`EXCLUDED.via_channel`,
        zendesk_created_at: sql`EXCLUDED.zendesk_created_at`,
        zendesk_updated_at: sql`EXCLUDED.zendesk_updated_at`,
        subject: sql`EXCLUDED.subject`,
        raw_subject: sql`EXCLUDED.raw_subject`,
        description: sql`EXCLUDED.description`,
        status: sql`EXCLUDED.status`,
        priority: sql`EXCLUDED.priority`,
        is_public: sql`EXCLUDED.is_public`,
        tags: sql`EXCLUDED.tags`,
        assignee_id: sql`EXCLUDED.assignee_id`,
        submitter_id: sql`EXCLUDED.submitter_id`,
        requester_id: sql`EXCLUDED.requester_id`,
        organization_id: sql`EXCLUDED.organization_id`,
        group_id: sql`EXCLUDED.group_id`,
        collaborator_ids: sql`EXCLUDED.collaborator_ids`,
        follower_ids: sql`EXCLUDED.follower_ids`,
      },
    });
  return result;
}

export async function getAllTickets(): Promise<InferSelectModel<typeof tickets>[]> {
  return await db.select().from(tickets).orderBy(tickets.zendesk_updated_at);
}

export async function getTicketsPaginated(
  page: number = 1,
  limit: number = 50,
  sortBy: string = "zendesk_updated_at",
  sortOrder: "asc" | "desc" = "desc"
): Promise<{
  tickets: InferSelectModel<typeof tickets>[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;
  
  // Build the order by clause based on sortBy and sortOrder
  let orderByClause;
  switch (sortBy) {
    case "zendesk_created_at":
      orderByClause = sortOrder === "asc" ? asc(tickets.zendesk_created_at) : desc(tickets.zendesk_created_at);
      break;
    case "zendesk_updated_at":
      orderByClause = sortOrder === "asc" ? asc(tickets.zendesk_updated_at) : desc(tickets.zendesk_updated_at);
      break;
    case "subject":
      orderByClause = sortOrder === "asc" ? asc(tickets.subject) : desc(tickets.subject);
      break;
    case "priority":
      orderByClause = sortOrder === "asc" ? asc(tickets.priority) : desc(tickets.priority);
      break;
    case "status":
      orderByClause = sortOrder === "asc" ? asc(tickets.status) : desc(tickets.status);
      break;
    default:
      orderByClause = desc(tickets.zendesk_updated_at);
  }

  const [ticketsResult, totalResult] = await Promise.all([
    db
      .select()
      .from(tickets)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(tickets)
  ]);

  const total = totalResult[0]?.count || 0;
  const hasMore = offset + limit < total;

  return {
    tickets: ticketsResult,
    total,
    hasMore
  };
}
