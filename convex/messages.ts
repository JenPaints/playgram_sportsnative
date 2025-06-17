import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a channel (direct, group, or broadcast)
export const createChannel = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("direct"), v.literal("group"), v.literal("broadcast")),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      type: args.type,
      members: args.members,
      createdAt: Date.now(),
    });
    return { success: true, channelId };
  },
});

// Add a user to a channel
export const addToChannel = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    if (!channel.members.includes(args.userId)) {
      await ctx.db.patch(args.channelId, {
        members: [...channel.members, args.userId],
      });
    }
    return { success: true };
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("notification")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      senderId: userId,
      content: args.content,
      type: args.type,
      createdAt: Date.now(),
    });
    // TODO: Trigger push notification here
    return { success: true };
  },
});

// List messages in a channel
export const listMessages = query({
  args: { channelId: v.id("channels") },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      channelId: v.id("channels"),
      senderId: v.id("users"),
      content: v.string(),
      type: v.union(v.literal("text"), v.literal("notification")),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("asc")
      .collect();
    
    // Map the messages to match the expected schema
    return messages.map(msg => ({
      _id: msg._id,
      channelId: msg.channelId,
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt
    }));
  },
});

// List channels for a user
export const listChannels = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("channels"),
      _creationTime: v.number(),
      name: v.string(),
      type: v.union(v.literal("direct"), v.literal("group"), v.literal("broadcast")),
      members: v.array(v.id("users")),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const channels = await ctx.db.query("channels").collect();
    // Only return channels the user is a member of (or all for admin)
    return channels.filter(
      (c) => c.members.includes(userId) || c.type === "broadcast"
    );
  },
}); 