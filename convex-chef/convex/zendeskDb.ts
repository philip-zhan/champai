import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getSyncStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.db.query("syncStatus").first();
    return status;
  },
});

export const initializeSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("syncStatus").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        isRunning: true,
        lastError: undefined,
      });
    } else {
      await ctx.db.insert("syncStatus", {
        isRunning: true,
        totalTickets: 0,
        totalComments: 0,
      });
    }
  },
});

export const completSync = internalMutation({
  args: {
    totalTickets: v.number(),
    totalComments: v.number(),
    isFullSync: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("syncStatus").first();
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        isRunning: false,
        totalTickets: args.totalTickets,
        totalComments: args.totalComments,
        lastError: undefined,
        ...(args.isFullSync 
          ? { lastFullSync: now, lastIncrementalSync: now }
          : { lastIncrementalSync: now }
        ),
      });
    }
  },
});

export const failSync = internalMutation({
  args: {
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("syncStatus").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        isRunning: false,
        lastError: args.error,
      });
    }
  },
});

export const upsertTicket = internalMutation({
  args: {
    ticket: v.object({
      zendeskId: v.number(),
      subject: v.string(),
      description: v.string(),
      status: v.union(v.string(), v.null()),
      priority: v.union(v.string(), v.null()),
      type: v.union(v.string(), v.null()),
      tags: v.array(v.string()),
      assigneeId: v.union(v.number(), v.null()),
      requesterId: v.number(),
      submitterId: v.number(),
      organizationId: v.union(v.number(), v.null()),
      createdAt: v.string(),
      updatedAt: v.string(),
      url: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tickets")
      .withIndex("by_zendesk_id", (q) => q.eq("zendeskId", args.ticket.zendeskId))
      .first();

    const ticketData = {
      ...args.ticket,
      status: args.ticket.status || undefined,
      priority: args.ticket.priority || undefined,
      type: args.ticket.type || undefined,
      assigneeId: args.ticket.assigneeId || undefined,
      organizationId: args.ticket.organizationId || undefined,
      lastSyncedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, ticketData);
      return existing._id;
    } else {
      return await ctx.db.insert("tickets", ticketData);
    }
  },
});

export const upsertComment = internalMutation({
  args: {
    comment: v.object({
      zendeskId: v.number(),
      ticketId: v.id("tickets"),
      zendeskTicketId: v.number(),
      body: v.string(),
      htmlBody: v.string(),
      plainBody: v.string(),
      authorId: v.number(),
      public: v.boolean(),
      type: v.string(),
      createdAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("comments")
      .withIndex("by_zendesk_id", (q) => q.eq("zendeskId", args.comment.zendeskId))
      .first();

    const commentData = {
      ...args.comment,
      lastSyncedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, commentData);
      return existing._id;
    } else {
      return await ctx.db.insert("comments", commentData);
    }
  },
});
