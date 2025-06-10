import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. Generate an upload URL for direct file upload from the client
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx, args) => {
    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },
});

// 2. Store a file in Convex storage (register after upload)
export const storeFile = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // This is a no-op for Convex, but you can add metadata if needed
    return { storageId: args.storageId };
  },
});

// 3. Get a public URL for a file
export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
}); 