import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Mutation to update payment status (called by createRazorpayOrder)
export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("attempted")),
    notes: v.optional(v.string()),
    paymentPeriod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Verify user has permission
    if (identity.subject !== payment.userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.paymentId, {
      status: args.status,
      notes: args.notes,
      paymentPeriod: args.paymentPeriod,
      updatedAt: Date.now(),
    });

    return args.paymentId;
  },
});

// Mutation to set payment as completed (called by verifyRazorpayPayment)
export const setPaymentCompleted = mutation({
  args: {
    paymentId: v.id("payments"),
    transactionId: v.string(),
    paymentDate: v.number(),
    receiptNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get payment and verify it exists
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Verify payment is in pending state
    if (payment.status !== "pending") {
      throw new Error("Payment is not in pending state");
    }

    // Get user profile to check role
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Verify user has permission (either the payment owner or an admin)
    if (payment.userId !== userId && profile.role !== "admin") {
      throw new Error("Not authorized");
    }

    // Get enrollment to verify it exists
    const enrollment = await ctx.db.get(payment.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Update payment status
    await ctx.db.patch(args.paymentId, {
      status: "completed",
      transactionId: args.transactionId,
      paymentDate: args.paymentDate,
      receiptNumber: args.receiptNumber,
      updatedAt: Date.now(),
    });

    // Update enrollment payment status
    await ctx.db.patch(payment.enrollmentId, {
      paymentStatus: "paid",
    });

    return args.paymentId;
  },
});

// Get payment details with enriched data
export const getPaymentDetails = query({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    const user = await ctx.db.get(payment.userId);
    const enrollment = await ctx.db.get(payment.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const sport = await ctx.db.get(enrollment.sportId);
    const batch = await ctx.db.get(enrollment.batchId);
    if (!sport || !batch) {
      throw new Error("Sport or batch not found");
    }

    return {
      ...payment,
      user: {
        name: user?.name,
        email: user?.email,
      },
      enrollment: {
        sportId: enrollment.sportId,
        batchId: enrollment.batchId,
        sport: { name: sport.name },
        batch: { name: batch.name },
      },
    };
  },
});

// List payments with filtering
export const listPayments = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("attempted"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    enrollmentId: v.optional(v.id("enrollments")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("payments");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.startDate && args.endDate) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate!),
          q.lte(q.field("createdAt"), args.endDate!)
        )
      );
    }

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    if (args.enrollmentId) {
      query = query.filter((q) => q.eq(q.field("enrollmentId"), args.enrollmentId));
    }

    const payments = await query.collect();

    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        // Get profile using the by_user index
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", payment.userId))
          .first();

        // Get user to access email
        const user = await ctx.db.get(payment.userId);

        const enrollment = await ctx.db.get(payment.enrollmentId);
        if (!enrollment) return payment;

        const sport = await ctx.db.get(enrollment.sportId);
        const batch = await ctx.db.get(enrollment.batchId);
        if (!sport || !batch) return payment;

        return {
          ...payment,
          user: {
            name: profile ? `${profile.firstName} ${profile.lastName}` : 'N/A',
            email: user?.email || 'N/A',
            phone: profile?.phone || 'N/A',
          },
          enrollment: {
            sportId: enrollment.sportId,
            batchId: enrollment.batchId,
            sport: { name: sport.name },
            batch: { name: batch.name },
          },
        };
      })
    );

    return enrichedPayments;
  },
});

// Update payment details
export const updatePayment = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("attempted"))),
    notes: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    paymentPeriod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(args.paymentId, {
      ...(args.status && { status: args.status }),
      ...(args.notes && { notes: args.notes }),
      ...(args.receiptNumber && { receiptNumber: args.receiptNumber }),
      ...(args.paymentPeriod && { paymentPeriod: args.paymentPeriod }),
      updatedAt: Date.now(),
    });
  },
});

// Process refund
export const processRefund = mutation({
  args: {
    paymentId: v.id("payments"),
    refundAmount: v.number(),
    refundReason: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded");
    }

    await ctx.db.patch(args.paymentId, {
      refunded: true,
      refundAmount: args.refundAmount,
      refundReason: args.refundReason,
      refundDate: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get payment statistics
export const getPaymentStats = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();

    const stats = {
      totalRevenue: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      revenueByMethod: {} as Record<string, number>,
      revenueBySport: {} as Record<string, number>,
      revenueByBatch: {} as Record<string, number>,
    };

    for (const payment of payments) {
      if (payment.status === "completed") {
        stats.totalRevenue += payment.amount;
        stats.completedPayments++;

        // Revenue by payment method
        stats.revenueByMethod[payment.method] = (stats.revenueByMethod[payment.method] || 0) + payment.amount;

        // Get enrollment details
        const enrollment = await ctx.db.get(payment.enrollmentId);
        if (enrollment) {
          const sport = await ctx.db.get(enrollment.sportId);
          const batch = await ctx.db.get(enrollment.batchId);

          if (sport) {
            stats.revenueBySport[sport.name] = (stats.revenueBySport[sport.name] || 0) + payment.amount;
          }
          if (batch) {
            stats.revenueByBatch[batch.name] = (stats.revenueByBatch[batch.name] || 0) + payment.amount;
          }
        }
      } else if (payment.status === "pending") {
        stats.pendingPayments++;
      } else if (payment.status === "failed") {
        stats.failedPayments++;
      }
    }

    return stats;
  },
});

// Mark a payment as paid (cash)
export const markAsPaid = mutation({
  args: {
    id: v.id("payments"),
    method: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      method: args.method,
      notes: args.notes,
      paymentDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Generate bulk invoices for multiple students
export const generateBulkInvoices = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
    amount: v.float64(),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const invoices = await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        return ctx.db.insert("payments", {
          userId,
          enrollmentId: args.enrollmentId,
          amount: args.amount,
          status: "pending",
          method: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      })
    );

    return { success: true, invoiceIds: invoices };
  },
});

// List all payments for a user
export const listPaymentsForUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const payments = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("userId"), args.userId || identity.subject))
      .collect();

    return payments;
  },
});

// Create a new payment
export const createPayment = mutation({
  args: {
    userId: v.id("users"),
    enrollmentId: v.id("enrollments"),
    amount: v.number(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the enrollment to verify ownership
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Verify user has permission (either the user themselves or an admin)
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Check if the authenticated user is either the enrollment owner or an admin
    if (enrollment.userId !== args.userId && profile.role !== "admin") {
      throw new Error("Not authorized");
    }

    // Create payment record
    const paymentId = await ctx.db.insert("payments", {
      userId: args.userId,
      enrollmentId: args.enrollmentId,
      amount: args.amount,
      method: args.method,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

// Get total revenue for the last month
export const getTotalRevenueLastMonth = query({
  args: {},
  handler: async (ctx) => {
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const payments = await ctx.db.query("payments")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .filter((q) => q.gte(q.field("createdAt"), oneMonthAgo))
      .collect();

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    return totalRevenue;
  },
}); 