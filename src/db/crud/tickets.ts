import { db } from "@/db";
import { tickets } from "@/db/schema/tickets";
import { sql, asc, desc, and, inArray } from "drizzle-orm";
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
  sortOrder: "asc" | "desc" = "desc",
  filters: {
    priorities?: string[];
    statuses?: string[];
    channels?: string[];
  } = {}
): Promise<{
  tickets: (InferSelectModel<typeof tickets> & { commentCount: number })[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;
  
  // Build where clauses based on filters
  const whereConditions = [];
  
  if (filters.priorities && filters.priorities.length > 0) {
    whereConditions.push(inArray(tickets.priority, filters.priorities));
  }
  
  if (filters.statuses && filters.statuses.length > 0) {
    whereConditions.push(inArray(tickets.status, filters.statuses));
  }
  
  if (filters.channels && filters.channels.length > 0) {
    whereConditions.push(inArray(tickets.via_channel, filters.channels));
  }
  
  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  
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
    case "commentCount":
      orderByClause = sortOrder === "asc" ? sql`commentCount ASC` : sql`commentCount DESC`;
      break;
    default:
      orderByClause = desc(tickets.zendesk_updated_at);
  }

  const [ticketsResult, totalResult] = await Promise.all([
    db
      .select({
        id: tickets.id,
        zendesk_id: tickets.zendesk_id,
        raw: tickets.raw,
        url: tickets.url,
        via_channel: tickets.via_channel,
        zendesk_created_at: tickets.zendesk_created_at,
        zendesk_updated_at: tickets.zendesk_updated_at,
        subject: tickets.subject,
        raw_subject: tickets.raw_subject,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        is_public: tickets.is_public,
        tags: tickets.tags,
        submitter_id: tickets.submitter_id,
        requester_id: tickets.requester_id,
        assignee_id: tickets.assignee_id,
        organization_id: tickets.organization_id,
        group_id: tickets.group_id,
        collaborator_ids: tickets.collaborator_ids,
        follower_ids: tickets.follower_ids,
        created_at: tickets.created_at,
        updated_at: tickets.updated_at,
        deleted_at: tickets.deleted_at,
        commentCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ticket_comments 
          WHERE zendesk_ticket_id = ${tickets.zendesk_id}
        )`
      })
      .from(tickets)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(tickets).where(whereClause)
  ]);

  const total = totalResult[0]?.count || 0;
  const hasMore = offset + limit < total;

  return {
    tickets: ticketsResult,
    total,
    hasMore
  };
}
