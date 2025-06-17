import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getCurrentStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.query("students").withIndex("by_user", q => q.eq("userId", userId)).first();
  },
});

// Mutation to create a student record for the current user (or a specified userId)
export const createStudent = mutation({
  args: {
    userId: v.optional(v.id("users")),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const authUserId = await getAuthUserId(ctx);
      if (!authUserId) throw new Error("Not authenticated");
      userId = authUserId;
    }
    // Check if already exists
    const existing = await ctx.db.query("students").withIndex("by_user", q => q.eq("userId", userId)).first();
    if (existing) throw new Error("Student record already exists for this user");
    // Use name if provided, else fallback to profile name
    let name = args.name;
    if (!name) {
      const profile = await ctx.db.query("profiles").withIndex("by_user", q => q.eq("userId", userId)).first();
      name = profile ? `${profile.firstName} ${profile.lastName}` : "";
    }
    // Generate a QR code string (could be userId or something else)
    const qrCode = `${userId}_${Date.now()}`;
    await ctx.db.insert("students", {
      name,
      userId,
      qrCode,
      totalPoints: 0,
    });
    return { success: true };
  },
}); 