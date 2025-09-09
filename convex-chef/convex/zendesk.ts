"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ZENDESK_SUBDOMAIN = "d3v-champ9881";
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN;

interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  type: string | null;
  tags: string[];
  assignee_id: number | null;
  requester_id: number;
  submitter_id: number;
  organization_id: number | null;
  created_at: string;
  updated_at: string;
  url: string;
}

interface ZendeskComment {
  id: number;
  body: string;
  html_body: string;
  plain_body: string;
  author_id: number;
  public: boolean;
  type: string;
  created_at: string;
}

interface ZendeskResponse<T> {
  [key: string]: T[] | string | null | number;
  next_page: string | null;
  previous_page: string | null;
  count: number;
}

async function makeZendeskRequest(endpoint: string): Promise<any> {
  if (!ZENDESK_API_TOKEN) {
    throw new Error("ZENDESK_API_TOKEN environment variable is required");
  }

  const url = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${ZENDESK_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 429) {
    // Rate limited - wait and retry
    const retryAfter = parseInt(response.headers.get('retry-after') || '60');
    console.log(`Rate limited, waiting ${retryAfter} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeZendeskRequest(endpoint);
  }

  if (!response.ok) {
    throw new Error(`Zendesk API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const startSync = action({
  args: {},
  handler: async (ctx) => {
    // Check if sync is already running
    const status = await ctx.runQuery(internal.zendeskDb.getSyncStatus);
    if (status?.isRunning) {
      throw new Error("Sync is already running");
    }

    // Initialize sync status
    await ctx.runMutation(internal.zendeskDb.initializeSync);

    // Start the sync process
    await ctx.runAction(internal.zendesk.performFullSync);
    
    return { success: true };
  },
});

export const performFullSync = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Starting full Zendesk sync...");
      
      // Get tickets updated in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startTime = thirtyDaysAgo.toISOString();
      
      let nextPage: string | null = `tickets.json?updated_since=${startTime}&include=comment_count&sort_by=updated_at&sort_order=desc`;
      let totalTickets = 0;
      let totalComments = 0;

      while (nextPage) {
        console.log(`Fetching tickets from: ${nextPage}`);
        const response: ZendeskResponse<ZendeskTicket> = await makeZendeskRequest(nextPage);
        
        const tickets = (response.tickets || []) as ZendeskTicket[];
        console.log(`Processing ${tickets.length} tickets...`);

        for (const ticket of tickets) {
          // Save ticket
          const ticketId = await ctx.runMutation(internal.zendeskDb.upsertTicket, {
            ticket: {
              zendeskId: ticket.id,
              subject: ticket.subject,
              description: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              type: ticket.type,
              tags: ticket.tags,
              assigneeId: ticket.assignee_id,
              requesterId: ticket.requester_id,
              submitterId: ticket.submitter_id,
              organizationId: ticket.organization_id,
              createdAt: ticket.created_at,
              updatedAt: ticket.updated_at,
              url: ticket.url,
            }
          });

          // Fetch and save comments for this ticket
          const commentsCount = await ctx.runAction(internal.zendesk.syncTicketComments, {
            ticketId,
            zendeskTicketId: ticket.id,
          });
          
          totalComments += commentsCount;
          totalTickets++;
        }

        // Get next page URL
        nextPage = response.next_page ? response.next_page.split('/api/v2/')[1] : null;
        
        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update sync status
      await ctx.runMutation(internal.zendeskDb.completSync, {
        totalTickets,
        totalComments,
        isFullSync: true,
      });

      console.log(`Sync completed: ${totalTickets} tickets, ${totalComments} comments`);
    } catch (error) {
      console.error("Sync failed:", error);
      await ctx.runMutation(internal.zendeskDb.failSync, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

export const syncTicketComments = internalAction({
  args: {
    ticketId: v.id("tickets"),
    zendeskTicketId: v.number(),
  },
  handler: async (ctx, args) => {
    let nextPage: string | null = `tickets/${args.zendeskTicketId}/comments.json`;
    let commentCount = 0;

    while (nextPage) {
      const response: ZendeskResponse<ZendeskComment> = await makeZendeskRequest(nextPage);
      const comments = (response.comments || []) as ZendeskComment[];

      for (const comment of comments) {
        await ctx.runMutation(internal.zendeskDb.upsertComment, {
          comment: {
            zendeskId: comment.id,
            ticketId: args.ticketId,
            zendeskTicketId: args.zendeskTicketId,
            body: comment.body,
            htmlBody: comment.html_body,
            plainBody: comment.plain_body,
            authorId: comment.author_id,
            public: comment.public,
            type: comment.type,
            createdAt: comment.created_at,
          }
        });
        commentCount++;
      }

      nextPage = response.next_page ? response.next_page.split('/api/v2/')[1] : null;
    }

    return commentCount;
  },
});

export const performIncrementalSync = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      const status = await ctx.runQuery(internal.zendeskDb.getSyncStatus);
      if (!status?.lastFullSync) {
        throw new Error("No previous full sync found. Please run a full sync first.");
      }

      const lastSync = new Date(status.lastIncrementalSync || status.lastFullSync);
      const startTime = lastSync.toISOString();
      
      console.log(`Starting incremental sync from ${startTime}...`);
      
      let nextPage: string | null = `tickets.json?updated_since=${startTime}&include=comment_count&sort_by=updated_at&sort_order=desc`;
      let totalTickets = 0;
      let totalComments = 0;

      while (nextPage) {
        const response: ZendeskResponse<ZendeskTicket> = await makeZendeskRequest(nextPage);
        const tickets = (response.tickets || []) as ZendeskTicket[];

        for (const ticket of tickets) {
          const ticketId = await ctx.runMutation(internal.zendeskDb.upsertTicket, {
            ticket: {
              zendeskId: ticket.id,
              subject: ticket.subject,
              description: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              type: ticket.type,
              tags: ticket.tags,
              assigneeId: ticket.assignee_id,
              requesterId: ticket.requester_id,
              submitterId: ticket.submitter_id,
              organizationId: ticket.organization_id,
              createdAt: ticket.created_at,
              updatedAt: ticket.updated_at,
              url: ticket.url,
            }
          });

          const commentsCount = await ctx.runAction(internal.zendesk.syncTicketComments, {
            ticketId,
            zendeskTicketId: ticket.id,
          });
          
          totalComments += commentsCount;
          totalTickets++;
        }

        nextPage = response.next_page ? response.next_page.split('/api/v2/')[1] : null;
      }

      await ctx.runMutation(internal.zendeskDb.completSync, {
        totalTickets,
        totalComments,
        isFullSync: false,
      });

      console.log(`Incremental sync completed: ${totalTickets} tickets, ${totalComments} comments`);
    } catch (error) {
      console.error("Incremental sync failed:", error);
      await ctx.runMutation(internal.zendeskDb.failSync, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
