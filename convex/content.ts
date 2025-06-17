import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Slides CRUD
export const listSlides = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("slides"),
      title: v.string(),
      subtitle: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      order: v.number(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("slides").order("asc").collect();
  },
});

export const getSlide = query({
  args: { slideId: v.id("slides") },
  returns: v.union(
    v.object({
      _id: v.id("slides"),
      title: v.string(),
      subtitle: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      order: v.number(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.slideId);
  },
});

export const createSlide = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  },
  returns: v.id("slides"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("slides", args);
  },
});

export const updateSlide = mutation({
  args: {
    slideId: v.id("slides"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.slideId, {
      title: args.title,
      subtitle: args.subtitle,
      imageUrl: args.imageUrl,
      order: args.order,
      isActive: args.isActive,
    });
    return null;
  },
});

export const deleteSlide = mutation({
  args: { slideId: v.id("slides") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.slideId);
    return null;
  },
});

// Content CRUD
export const listContent = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("content"),
      key: v.string(),
      value: v.string(),
      type: v.union(v.literal("text"), v.literal("html"), v.literal("markdown")),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("content").collect();
  },
});

export const getContent = query({
  args: { contentId: v.id("content") },
  returns: v.union(
    v.object({
      _id: v.id("content"),
      key: v.string(),
      value: v.string(),
      type: v.union(v.literal("text"), v.literal("html"), v.literal("markdown")),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contentId);
  },
});

export const createContent = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    type: v.union(v.literal("text"), v.literal("html"), v.literal("markdown")),
    isActive: v.boolean(),
  },
  returns: v.id("content"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("content", args);
  },
});

export const updateContent = mutation({
  args: {
    contentId: v.id("content"),
    key: v.string(),
    value: v.string(),
    type: v.union(v.literal("text"), v.literal("html"), v.literal("markdown")),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contentId, {
      key: args.key,
      value: args.value,
      type: args.type,
      isActive: args.isActive,
    });
    return null;
  },
});

export const deleteContent = mutation({
  args: { contentId: v.id("content") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contentId);
    return null;
  },
}); 