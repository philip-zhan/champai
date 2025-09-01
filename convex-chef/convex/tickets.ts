import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .order("desc")
      .take(args.limit || 50);

    return tickets;
  },
});

export const getById = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    return {
      ...ticket,
      comments: comments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    };
  },
});

export const getSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("syncStatus").first();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const totalTickets = (await ctx.db.query("tickets").collect()).length;
    const totalComments = (await ctx.db.query("comments").collect()).length;

    const statusCounts = await ctx.db.query("tickets").collect();
    const statusBreakdown = statusCounts.reduce(
      (acc, ticket) => {
        acc[ticket.status || "unknown"] =
          (acc[ticket.status || "unknown"] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalTickets,
      totalComments,
      statusBreakdown,
    };
  },
});
