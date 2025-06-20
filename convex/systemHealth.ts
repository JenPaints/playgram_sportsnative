import { query, mutation, action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// System health metrics interface
interface SystemMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  totalRequests: number;
  failedRequests: number;
  lastTestTime: number;
  testStatus: "pass" | "fail" | "pending";
  cpuUsage: number;
  memoryUsage: number;
}

// System metrics interface for reference
// (not used directly in Convex, but helpful for TS type hints)
// interface SystemMetrics {
//   uptime: number;
//   responseTime: number;
//   errorRate: number;
//   activeUsers: number;
//   totalRequests: number;
//   failedRequests: number;
//   lastTestTime: number;
//   testStatus: "pass" | "fail" | "pending";
//   cpuUsage: number;
//   memoryUsage: number;
//   timestamp: number;
// }

// Store system metrics
export const updateSystemMetrics = internalMutation({
  args: {
    uptime: v.number(),
    responseTime: v.number(),
    errorRate: v.number(),
    activeUsers: v.number(),
    totalRequests: v.number(),
    failedRequests: v.number(),
    lastTestTime: v.number(),
    testStatus: v.union(
      v.literal("pass"),
      v.literal("fail"),
      v.literal("pending")
    ),
    cpuUsage: v.number(),
    memoryUsage: v.number(),
    timestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("system_metrics", args);
    return null;
  },
});

// Get latest system metrics
export const getSystemMetrics = query({
  args: {},
  returns: v.union(
    v.object({
      uptime: v.number(),
      responseTime: v.number(),
      errorRate: v.number(),
      activeUsers: v.number(),
      totalRequests: v.number(),
      failedRequests: v.number(),
      lastTestTime: v.number(),
      testStatus: v.union(
        v.literal("pass"),
        v.literal("fail"),
        v.literal("pending")
      ),
      cpuUsage: v.number(),
      memoryUsage: v.number(),
      timestamp: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("system_metrics")
      .order("desc")
      .first();
    if (!metrics) return null;
    const {
      uptime, responseTime, errorRate, activeUsers, totalRequests,
      failedRequests, lastTestTime, testStatus, cpuUsage, memoryUsage, timestamp
    } = metrics;
    return {
      uptime, responseTime, errorRate, activeUsers, totalRequests,
      failedRequests, lastTestTime, testStatus, cpuUsage, memoryUsage, timestamp
    };
  },
});

// Run system stress test
export const runStressTest = mutation({
  args: {},
  handler: async (ctx) => {
    // Update test status to pending
    await ctx.db.insert("system_metrics", {
      uptime: 0,
      responseTime: 0,
      errorRate: 0,
      activeUsers: 0,
      totalRequests: 0,
      failedRequests: 0,
      lastTestTime: Date.now(),
      testStatus: "pending",
      cpuUsage: 0,
      memoryUsage: 0,
      timestamp: Date.now(),
    });

    // Schedule the actual stress test
    await ctx.scheduler.runAfter(0, internal.systemHealth_actions.executeStressTest, {});
  },
}); 