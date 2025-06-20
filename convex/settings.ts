import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Singleton settings doc id
const SETTINGS_ID = "global";

export const setMaintenanceMode = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Upsert singleton settings doc
    const existing = await ctx.db.query("settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, { maintenanceMode: args.enabled });
    } else {
      await ctx.db.insert("settings", { maintenanceMode: args.enabled });
    }
    return null;
  },
});

export const setGlobalAnnouncement = mutation({
  args: { message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, { announcement: args.message });
    } else {
      await ctx.db.insert("settings", { announcement: args.message });
    }
    return null;
  },
});

export const setThemeSettings = mutation({
  args: {
    mode: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    fontSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    borderRadius: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: {
          mode: args.mode,
          primaryColor: args.primaryColor,
          secondaryColor: args.secondaryColor,
          fontSize: args.fontSize,
          borderRadius: args.borderRadius,
        },
      });
    } else {
      await ctx.db.insert("settings", {
        theme: {
          mode: args.mode,
          primaryColor: args.primaryColor,
          secondaryColor: args.secondaryColor,
          fontSize: args.fontSize,
          borderRadius: args.borderRadius,
        },
      });
    }
    return null;
  },
});

export const getSettings = query({
  args: {},
  returns: v.object({
    maintenanceMode: v.optional(v.boolean()),
    announcement: v.optional(v.string()),
    theme: v.optional(v.object({
      mode: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
      primaryColor: v.string(),
      secondaryColor: v.string(),
      fontSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
      borderRadius: v.string(),
    })),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    return {
      maintenanceMode: settings?.maintenanceMode,
      announcement: settings?.announcement,
      theme: settings?.theme,
    };
  },
}); 