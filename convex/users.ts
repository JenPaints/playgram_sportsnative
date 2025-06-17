import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Get current user profile with populated data
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    return {
      ...user,
      profile,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      address: args.address,
      emergencyContact: args.emergencyContact,
      ...(args.photoUrl !== undefined ? { photoUrl: args.photoUrl } : {}),
    });

    return { success: true };
  },
});

// Get all users for admin
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const profiles = await ctx.db.query("profiles").collect();
    const users = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (user && !user.deleted) {
          return {
            ...profile,
            email: user.email,
          };
        }
        return null;
      })
    );

    // Filter out nulls (deleted users)
    return users.filter((u) => u !== null);
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    profileId: v.id("profiles"),
    role: v.union(v.literal("student"), v.literal("coach"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.profileId, {
      role: args.role,
    });

    return { success: true };
  },
});

// Update subscription status
export const updateSubscriptionStatus = mutation({
  args: {
    profileId: v.id("profiles"),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("expired")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.profileId, {
      subscriptionStatus: args.status,
    });

    return { success: true };
  },
});

// Add points to user
export const addPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    const newPoints = profile.totalPoints + args.points;
    const newLevel = Math.floor(newPoints / 100) + 1;

    await ctx.db.patch(profile._id, {
      totalPoints: newPoints,
      level: newLevel,
    });

    // Record the points transaction
    await ctx.db.insert("pointsHistory", {
      userId: args.userId,
      points: args.points,
      reason: args.reason,
      timestamp: Date.now(),
    });

    return { success: true, newPoints, newLevel };
  },
});

// Get leaderboard
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    const leaderboard = profiles
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 50)
      .map((profile, index) => ({
        ...profile,
        rank: index + 1,
      }));

    return leaderboard;
  },
});

// Admin: Create user profile
export const createUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("coach"), v.literal("admin")),
    isActive: v.boolean(),
    subscriptionStatus: v.union(v.literal("active"), v.literal("pending"), v.literal("expired")),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    // Create a new user in the users table
    const newUserId = await ctx.db.insert("users", {});
    // Generate unique session ID
    const sessionId = `${newUserId}_${Date.now()}`;
    // Create profile
    const profileId = await ctx.db.insert("profiles", {
      userId: newUserId,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      address: args.address,
      emergencyContact: args.emergencyContact,
      role: args.role,
      sessionId,
      isActive: args.isActive,
      subscriptionStatus: args.subscriptionStatus,
      totalPoints: 0,
      level: args.level,
      joinedAt: Date.now(),
    });
    return { success: true, profileId };
  },
});

// Admin: Update user profile
export const updateUser = mutation({
  args: {
    profileId: v.id("profiles"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("coach"), v.literal("admin")),
    isActive: v.boolean(),
    subscriptionStatus: v.union(v.literal("active"), v.literal("pending"), v.literal("expired")),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    await ctx.db.patch(args.profileId, {
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      address: args.address,
      emergencyContact: args.emergencyContact,
      role: args.role,
      isActive: args.isActive,
      subscriptionStatus: args.subscriptionStatus,
      level: args.level,
    });
    return { success: true };
  },
});

// Admin: Delete user profile and user
export const deleteUser = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");
    await ctx.db.delete(args.profileId);
    // Optionally, delete the user document as well
    if (profile.userId) {
      const userDoc = await ctx.db.get(profile.userId);
      if (userDoc) {
        // Mark as deleted instead of deleting
        await ctx.db.patch(profile.userId, { deleted: true });
      }
    }
    return { success: true };
  },
});

export const getUser = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const listRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("profiles")
      .order("desc")
      .take(5);

    // In a real app, you'd also fetch recent enrollments, payments, etc.
    // and merge them, sorting by _creationTime.

    const recentActivity = users.map(user => ({
      type: "user_registered",
      description: `New user registered: ${user.firstName} ${user.lastName}`,
      createdAt: user._creationTime,
    }));

    // Sort by creation time if merging from multiple tables
    // recentActivity.sort((a, b) => b.createdAt - a.createdAt);

    return recentActivity;
  },
});

// Query to count users with optional date range filtering
export const countUsers = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    role: v.optional(v.union(v.literal("student"), v.literal("coach"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("profiles");

    if (args.startDate && args.endDate) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), args.startDate!),
          q.lte(q.field("_creationTime"), args.endDate!)
        )
      );
    }

    if (args.role) {
      query = query.filter((q) => q.eq(q.field("role"), args.role));
    }

    // Ensure .withoutData() is NOT used here
    const count = await query.collect();
    return count.length;
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("email", q => q.eq("email", args.email)).first();
  },
});

// Restore user (admin only, for undo)
export const restoreUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    await ctx.db.patch(args.userId, { deleted: false });
    return { success: true };
  },
});

// Bulk activate users (admin only)
export const bulkActivateUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    for (const userId of args.userIds) {
      const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first();
      if (profile) {
        await ctx.db.patch(profile._id, { isActive: true });
      }
    }
    return { success: true };
  },
});

// Bulk deactivate users (admin only)
export const bulkDeactivateUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    for (const userId of args.userIds) {
      const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first();
      if (profile) {
        await ctx.db.patch(profile._id, { isActive: false });
      }
    }
    return { success: true };
  },
});
