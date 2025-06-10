import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const createSubscription = action({
  args: {
    batchId: v.id("batches"),
    sportId: v.id("sports"),
  },
  handler: async (ctx, args): Promise<any> => {
    // Call the internal Node.js action
    return await ctx.runAction(internal.razorpay_internal.createSubscriptionInternal, args);
  },
}); 