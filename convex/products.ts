import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all products
export const listProducts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("products"),
      _creationTime: v.float64(),
      name: v.string(),
      description: v.string(),
      price: v.float64(),
      imageUrl: v.optional(v.string()),
      stock: v.float64(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    return products;
  },
});

// Get product by ID
export const getProduct = query({
  args: { productId: v.id("products") },
  returns: v.union(
    v.object({
      _id: v.id("products"),
      _creationTime: v.float64(),
      name: v.string(),
      description: v.string(),
      price: v.float64(),
      imageUrl: v.optional(v.string()),
      stock: v.float64(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    return product;
  },
});

// Create product
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.float64(),
    imageUrl: v.optional(v.string()),
    stock: v.float64(),
    isActive: v.boolean(),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

// Update product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.float64(),
    imageUrl: v.optional(v.string()),
    stock: v.float64(),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      name: args.name,
      description: args.description,
      price: args.price,
      imageUrl: args.imageUrl,
      stock: args.stock,
      isActive: args.isActive,
    });
    return null;
  },
});

// Delete product
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.productId);
    return null;
  },
});

// Create merchandise order after payment
export const createOrder = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    amount: v.float64(),
    paymentId: v.optional(v.id("payments")),
    pickupSession: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check product exists and has enough stock
    const product = await ctx.db.get(args.productId);
    if (!product || !product.isActive) throw new Error("Product not found or inactive");
    if (product.stock < args.quantity) throw new Error("Insufficient stock");

    // Decrement stock
    await ctx.db.patch(args.productId, { stock: product.stock - args.quantity });

    // Create order
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId,
      productId: args.productId,
      quantity: args.quantity,
      amount: args.amount,
      paymentId: args.paymentId,
      status: args.paymentId ? "paid" : "pending",
      pickupSession: args.pickupSession,
      createdAt: now,
      updatedAt: now,
    });
    return orderId;
  },
});

// List orders (admin: all, student: own)
export const listOrders = query({
  args: {
    userId: v.optional(v.id("users")), // If not provided, admin gets all
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("ready_for_pickup"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      let q = ctx.db.query("orders").withIndex("by_user", (q2) => q2.eq("userId", args.userId!));
      const orders = await q.collect();
      if (args.status) {
        return orders.filter((order) => order.status === args.status);
      }
      return orders;
    } else if (args.status) {
      let q = ctx.db.query("orders").withIndex("by_status", (q2) => q2.eq("status", args.status!));
      return await q.collect();
    } else {
      return await ctx.db.query("orders").collect();
    }
  },
});

// Update order status (admin or student for their own order)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("ready_for_pickup"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    pickupSession: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    // Only admin or the order owner can update
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    if (order.userId !== userId && (!profile || profile.role !== "admin")) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.orderId, {
      status: args.status,
      pickupSession: args.pickupSession ?? order.pickupSession,
      updatedAt: Date.now(),
    });
    return args.orderId;
  },
}); 