import { query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all necessary data
    const users = await ctx.db.query("profiles").collect();
    const sports = await ctx.db.query("sports").collect();
    const batches = await ctx.db.query("batches").collect();
    const payments = await ctx.db.query("payments").collect();
    const enrollments = await ctx.db.query("enrollments").collect();
    const products = await ctx.db.query("products").collect();
    const orders = await ctx.db.query("orders").collect();

    // Basic KPIs
    const totalRevenue = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);

    const userGrowth = users.length;
    const activeUsers = users.filter(u => u.subscriptionStatus === "active").length; // Assuming a subscriptionStatus field

    // Revenue by Sport
    const revenueBySport: Record<string, number> = {};
    for (const payment of payments.filter(p => p.status === "completed")) {
      const enrollment = enrollments.find(e => e._id === payment.enrollmentId);
      if (enrollment) {
        const batch = batches.find(b => b._id === enrollment.batchId);
        if (batch) {
          const sport = sports.find(s => s._id === batch.sportId);
          if (sport) {
            revenueBySport[sport.name] = (revenueBySport[sport.name] ?? 0) + (payment.amount ?? 0);
          }
        }
      }
    }

    // Role Distribution (assuming 'role' field on profiles)
    const roleDistribution: Record<string, number> = {};
    for (const user of users) {
      const role = (user as any).role || "unknown"; // Cast to any to access role for now
      roleDistribution[role] = (roleDistribution[role] ?? 0) + 1;
    }

    // Subscription Stats (assuming 'subscriptionStatus' field on profiles)
    const subscriptionStats: Record<string, number> = {};
    for (const user of users) {
      const status = (user as any).subscriptionStatus || "unknown";
      subscriptionStats[status] = (subscriptionStats[status] ?? 0) + 1;
    }

    // Merchandise Analytics
    // Only count paid/ready_for_pickup/completed orders as 'sold'
    const soldStatuses = ["paid", "ready_for_pickup", "completed"];
    const soldOrders = orders.filter(o => soldStatuses.includes(o.status));
    const totalMerchandiseSold = soldOrders.reduce((sum, o) => sum + (o.quantity ?? 0), 0);
    const totalMerchandiseRevenue = soldOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);
    // Revenue by product
    const revenueByProduct: Record<string, number> = {};
    for (const order of soldOrders) {
      const product = products.find(p => p._id === order.productId);
      if (product) {
        revenueByProduct[product.name] = (revenueByProduct[product.name] ?? 0) + (order.amount ?? 0);
      }
    }

    return {
      totalRevenue,
      userGrowth,
      activeUsers,
      revenueBySport,
      roleDistribution,
      subscriptionStats,
      // Merchandise analytics:
      totalMerchandiseSold,
      totalMerchandiseRevenue,
      revenueByProduct,
    };
  },
}); 