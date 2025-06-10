import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all batches (admin only)
export const getAllBatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const batches = await ctx.db.query("batches").collect();
    
    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        const sport = await ctx.db.get(batch.sportId);
        
        let coach = null;
        if (batch.coachId) {
          const coachProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", batch.coachId!))
            .first();
          if (coachProfile) {
            coach = {
              name: `${coachProfile.firstName} ${coachProfile.lastName}`,
            };
          }
        }

        const students = await ctx.db
          .query("enrollments")
          .withIndex("by_batch", (q) => q.eq("batchId", batch._id))
          .collect();

        return {
          ...batch,
          sport,
          coach,
          students,
        };
      })
    );

    return enrichedBatches;
  },
});

// Get coach batches
export const getCoachBatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "coach") {
      return [];
    }

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_coach", (q) => q.eq("coachId", userId))
      .collect();

    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        const sport = await ctx.db.get(batch.sportId);
        
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_batch", (q) => q.eq("batchId", batch._id))
          .collect();

        const students = await Promise.all(
          enrollments.map(async (enrollment) => {
            const studentProfile = await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", enrollment.userId))
              .first();
            return {
              ...enrollment,
              profile: studentProfile,
            };
          })
        );

        return {
          ...batch,
          sport,
          students,
        };
      })
    );

    return enrichedBatches;
  },
});

// Create new batch (admin only)
export const createBatch = mutation({
  args: {
    name: v.string(),
    sportId: v.id("sports"),
    coachId: v.optional(v.id("users")),
    schedule: v.object({
      days: v.array(v.string()),
      startTime: v.string(),
      endTime: v.string(),
    }),
    maxStudents: v.number(),
    ageGroup: v.string(),
    level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    venue: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const batchId = await ctx.db.insert("batches", {
      ...args,
      currentStudents: 0,
      isActive: true,
      startDate: Date.now(),
    });

    return { success: true, batchId };
  },
});

// Update batch
export const updateBatch = mutation({
  args: {
    batchId: v.id("batches"),
    name: v.string(),
    coachId: v.optional(v.id("users")),
    schedule: v.object({
      days: v.array(v.string()),
      startTime: v.string(),
      endTime: v.string(),
    }),
    maxStudents: v.number(),
    ageGroup: v.string(),
    level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    venue: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { batchId, ...updateData } = args;
    await ctx.db.patch(batchId, updateData);

    return { success: true };
  },
});

// Get batch students
export const getBatchStudents = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();

    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", enrollment.userId))
          .first();
        
        const user = await ctx.db.get(enrollment.userId);

        return {
          ...enrollment,
          profile,
          email: user?.email,
        };
      })
    );

    return students;
  },
});

// Assign coach to batch
export const assignCoach = mutation({
  args: {
    batchId: v.id("batches"),
    coachId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Verify coach exists and has coach role
    const coachProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.coachId))
      .first();

    if (!coachProfile || coachProfile.role !== "coach") {
      throw new Error("Invalid coach");
    }

    await ctx.db.patch(args.batchId, {
      coachId: args.coachId,
    });

    return { success: true };
  },
});

// Admin: Delete batch
export const deleteBatch = mutation({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }
    await ctx.db.delete(args.batchId);
    return { success: true };
  },
});

export const getBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.batchId);
  },
});

// Query to count batches with optional date range and active status filtering
export const countBatches = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("batches");

    if (args.startDate && args.endDate) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), args.startDate!),
          q.lte(q.field("_creationTime"), args.endDate!)
        )
      );
    }

     if (args.isActive !== undefined) {
       query = query.filter((q) => q.eq(q.field("isActive"), args.isActive!));
    }

    const count = await query.collect();
    return count.length;
  },
});
