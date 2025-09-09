import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  tickets: defineTable({
    zendeskId: v.number(),
    subject: v.string(),
    description: v.string(),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    type: v.optional(v.string()),
    tags: v.array(v.string()),
    assigneeId: v.optional(v.number()),
    requesterId: v.number(),
    submitterId: v.number(),
    organizationId: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
    url: v.string(),
    lastSyncedAt: v.number(),
  }).index("by_zendesk_id", ["zendeskId"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_last_synced", ["lastSyncedAt"]),

  comments: defineTable({
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
    lastSyncedAt: v.number(),
  }).index("by_zendesk_id", ["zendeskId"])
    .index("by_ticket", ["ticketId"])
    .index("by_zendesk_ticket_id", ["zendeskTicketId"]),

  syncStatus: defineTable({
    lastFullSync: v.optional(v.number()),
    lastIncrementalSync: v.optional(v.number()),
    isRunning: v.boolean(),
    totalTickets: v.number(),
    totalComments: v.number(),
    lastError: v.optional(v.string()),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
