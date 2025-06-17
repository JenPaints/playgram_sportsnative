import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create initial profile for new users
export const createProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("coach"), v.literal("admin")),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    // Generate unique session ID
    const sessionId = `${userId}_${Date.now()}`;

    const profileId = await ctx.db.insert("profiles", {
      userId,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      address: args.address,
      emergencyContact: args.emergencyContact,
      role: args.role,
      sessionId,
      isActive: true,
      subscriptionStatus: args.role === "student" ? "pending" : "active",
      totalPoints: 0,
      level: 1,
      joinedAt: Date.now(),
      ...(args.photoUrl !== undefined ? { photoUrl: args.photoUrl } : {}),
    });

    return { success: true, profileId };
  },
});

// Check if user needs profile setup
export const needsProfileSetup = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !profile;
  },
});

// Check if phone number is already used
export const checkPhoneDuplicate = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    if (!args.phone) return false;
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    return !!existing;
  },
});
