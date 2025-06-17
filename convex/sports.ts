import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active sports
export const getActiveSports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sports")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get all sports (admin only)
export const getAllSports = query({
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

    return await ctx.db.query("sports").collect();
  },
});

// Create new sport (admin only)
export const createSport = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    maxStudentsPerBatch: v.number(),
    pricePerMonth: v.number(),
    equipment: v.array(v.string()),
    ageGroups: v.array(v.string()),
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

    const sportId = await ctx.db.insert("sports", {
      ...args,
      isActive: true,
    });

    return { success: true, sportId };
  },
});

// Update sport
export const updateSport = mutation({
  args: {
    sportId: v.id("sports"),
    name: v.string(),
    description: v.string(),
    maxStudentsPerBatch: v.number(),
    pricePerMonth: v.number(),
    equipment: v.array(v.string()),
    ageGroups: v.array(v.string()),
    isActive: v.boolean(),
    imageUrl: v.optional(v.string()),
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

    const { sportId, ...updateData } = args;
    await ctx.db.patch(sportId, updateData);

    return { success: true };
  },
});

// Get sport details with batches
export const getSportDetails = query({
  args: { sportId: v.id("sports") },
  handler: async (ctx, args) => {
    const sport = await ctx.db.get(args.sportId);
    if (!sport) return null;

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_sport", (q) => q.eq("sportId", args.sportId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...sport,
      batches,
    };
  },
});

// Apply for sport batch
export const applyForSport = mutation({
  args: {
    batchId: v.id("batches"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Batch not found");

    if (batch.currentStudents >= batch.maxStudents) {
      throw new Error("Batch is full");
    }

    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_user_batch", (q) => 
        q.eq("userId", userId).eq("batchId", args.batchId)
      )
      .first();

    if (existingEnrollment) {
      throw new Error("Already enrolled in this batch");
    }

    // Create enrollment
    const enrollmentId = await ctx.db.insert("enrollments", {
      userId,
      batchId: args.batchId,
      sportId: batch.sportId,
      status: "active",
      paymentStatus: "pending",
      enrolledAt: Date.now(),
    });

    // Update batch student count
    await ctx.db.patch(args.batchId, {
      currentStudents: batch.currentStudents + 1,
    });

    return { success: true, enrollmentId };
  },
});

// Get user enrollments
export const getUserEnrollments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const batch = await ctx.db.get(enrollment.batchId);
        const sport = await ctx.db.get(enrollment.sportId);
        const sportImageUrl = sport?.imageUrl || null;
        const user = await ctx.db.get(enrollment.userId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", enrollment.userId))
          .first();

        let coach = null;
        if (batch?.coachId) {
          const coachProfile = batch.coachId
            ? await ctx.db
                .query("profiles")
                .withIndex("by_user", (q) =>
                  batch.coachId ? q.eq("userId", batch.coachId) : q
                )
                .first()
            : null;
          coach = coachProfile ? { name: `${coachProfile.firstName} ${coachProfile.lastName}` } : null;
        }

        // Calculate attendance percentage
        const attendanceRecords = await ctx.db
          .query("attendance")
          .withIndex("by_user_batch", (q) =>
            q.eq("userId", enrollment.userId).eq("batchId", enrollment.batchId)
          )
          .collect();

        const totalSessions = attendanceRecords.length;
        const presentSessions = attendanceRecords.filter(
          (record) => record.isPresent
        ).length;

        const attendancePercent =
          totalSessions > 0
            ? Math.round((presentSessions / totalSessions) * 100)
            : 0;

        return {
          ...enrollment,
          batch: batch ? { ...batch, coach } : null,
          sport,
          user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
          sportImageUrl,
          attendancePercent,
        };
      })
    );

    return enrichedEnrollments;
  },
});

export const updatePaymentStatus = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");

    // Check if user owns this enrollment or is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (enrollment.userId !== userId && profile?.role !== "admin") {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.enrollmentId, {
      paymentStatus: args.status,
    });

    return { success: true };
  },
});

export const getAllEnrollments = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("enrollments"),
      userId: v.id("users"),
      batchId: v.id("batches"),
      sportId: v.id("sports"),
      status: v.union(v.literal("active"), v.literal("inactive"), v.literal("completed")),
      paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
      enrolledAt: v.number(),
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db.query("enrollments").collect();
    return enrollments;
  },
});

export const getSport = query({
  args: { sportId: v.id("sports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sportId);
  },
});

// Query to count sports with optional date range filtering
export const countSports = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isActive: v.optional(v.boolean()), // Optionally filter by active status
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("sports");

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

export const deleteSport = mutation({
  args: {
    sportId: v.id("sports"),
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

    await ctx.db.delete(args.sportId);

    return { success: true };
  },
});

export const patchSport = internalMutation({
  args: { sportId: v.id("sports"), razorpayPlanId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sportId, { razorpayPlanId: args.razorpayPlanId });
    return null;
  },
});
