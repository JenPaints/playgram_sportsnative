import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const listRewards = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("rewards"),
      name: v.string(),
      type: v.union(v.literal("milestone"), v.literal("scratch_card")),
      points: v.number(),
      description: v.string(),
      isActive: v.boolean(),
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("rewards").collect();
  },
});

export const listRewardHistory = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("rewardHistory"),
      userId: v.id("users"),
      rewardId: v.id("rewards"),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("rewardHistory").order("desc").collect();
  },
});

export const createReward = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("milestone"), v.literal("scratch_card")),
    points: v.number(),
    description: v.string(),
    isActive: v.boolean(),
  },
  returns: v.id("rewards"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("rewards", args);
  },
});

export const updateReward = mutation({
  args: {
    rewardId: v.id("rewards"),
    name: v.string(),
    type: v.union(v.literal("milestone"), v.literal("scratch_card")),
    points: v.number(),
    description: v.string(),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { rewardId, ...update } = args;
    await ctx.db.patch(rewardId, update);
    return null;
  },
});

export const deleteReward = mutation({
  args: { rewardId: v.id("rewards") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.rewardId);
    return null;
  },
}); 