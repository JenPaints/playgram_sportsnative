import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const logAdminAction = mutation({
  args: {
    adminUserId: v.id("users"),
    action: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      adminUserId: args.adminUserId,
      action: args.action,
      details: args.details,
      timestamp: args.timestamp,
    });
    return { success: true };
  },
});

export const getAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    // Only allow admins to fetch logs
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity) throw new Error("Not authenticated");
    const userId = (typeof userIdentity === "string" ? userIdentity : userIdentity.subject) as Id<"users">;
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (!profile || profile.role !== "admin") throw new Error("Admin access required");
    return await ctx.db.query("auditLogs").order("desc").take(100);
  },
}); 