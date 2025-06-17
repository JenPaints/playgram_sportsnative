import { query } from "./_generated/server";
import { v } from "convex/values";

export const getEnrollment = query({
  args: {
    id: v.id("enrollments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listEnrollments = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("enrollments");
    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }
    return await query.collect();
  },
}); 