import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const insertSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    batchId: v.id("batches"),
    sportId: v.id("sports"),
    razorpaySubscriptionId: v.string(),
    status: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    planId: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptions", args);
  },
}); 