import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List all invoices
export const listInvoices = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("payments").collect();
    return invoices;
  },
});

// Get a single invoice
export const getInvoice = query({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  },
});

// Generate a new invoice
export const generateInvoice = mutation({
  args: {
    userId: v.id("users"),
    enrollmentId: v.id("enrollments"),
    amount: v.float64(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user and enrollment details
    const user = await ctx.db.get(args.userId);
    const enrollment = await ctx.db.get(args.enrollmentId);
    
    if (!user || !enrollment) {
      throw new Error("User or enrollment not found");
    }

    // Create payment record
    const paymentId = await ctx.db.insert("payments", {
      userId: args.userId,
      enrollmentId: args.enrollmentId,
      amount: args.amount,
      status: "pending",
      method: args.method,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      paymentDate: Date.now(),
      receiptNumber: `REC-${Date.now()}`,
      paymentPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM format
    });

    return paymentId;
  },
});

// Update invoice status
export const updateInvoiceStatus = mutation({
  args: {
    id: v.id("payments"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      transactionId: args.transactionId,
      updatedAt: Date.now(),
      paymentDate: args.status === "completed" ? Date.now() : invoice.paymentDate,
    });

    return { success: true };
  },
});

// Delete an invoice
export const deleteInvoice = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
}); 