import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import Google from "@auth/core/providers/google";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { modifyAccountCredentials } from "@convex-dev/auth/server";

// Required .env variables:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY

// Google OAuth: Set redirect URI in Google Cloud to:
// https://YOUR-CONVEX-DEPLOYMENT.site/api/auth/callback/google

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    Google,
    Anonymous,
  ],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) {
      return { ...user, profile: null };
    }
    return { ...user, profile };
  },
});

// Action to update password only
export const resetPasswordAction = action({
  args: { email: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.newPassword },
    });
    return { success: true };
  },
});

// Reset password mutation: validate token, mark as used, call action
export const resetPassword = mutation({
  args: { token: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    // Find token
    const record = await ctx.db.query("passwordResets").filter((q: any) => q.eq(q.field("token"), args.token)).first();
    if (!record || record.used || record.expiresAt < Date.now()) {
      throw new Error("Invalid or expired token");
    }
    // Find user by email
    const user = await ctx.db.query("users").withIndex("email", q => q.eq("email", record.email)).first();
    if (!user) throw new Error("User not found");
    // Mark token as used
    await ctx.db.patch(record._id, { used: true });
    // Call action to update password
    await ctx.scheduler.runAfter(0, api.auth.resetPasswordAction, { email: record.email, newPassword: args.newPassword });
    return { success: true };
  },
});

export const insertPasswordReset = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("passwordResets", {
      email: args.email,
      token: args.token,
      expiresAt: args.expiresAt,
      used: false,
    });
    return null;
  },
});

// Admin: Impersonate user (returns a token for the admin to use as the user)
export const impersonateUser = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    // Generate a token for the target user (pseudo, replace with real session logic)
    // In a real app, you would use your auth provider to issue a session for the user
    const token = `impersonate-${args.userId}-${Date.now()}`;
    // Optionally, log this action
    await ctx.runMutation(api.auditLogs.logAdminAction, {
      adminUserId: adminId,
      action: "impersonateUser",
      details: `Impersonated user ${args.userId}`,
      timestamp: Date.now(),
    });
    return { token };
  },
});

// Admin: Force logout user (invalidate all sessions)
export const forceLogoutUser = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    // Pseudo: Invalidate all sessions for the user (replace with real session logic)
    // Optionally, log this action
    await ctx.runMutation(api.auditLogs.logAdminAction, {
      adminUserId: adminId,
      action: "forceLogoutUser",
      details: `Forced logout for user ${args.userId}`,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});

// Log a session (create or update)
export const logSession = mutation({
  args: {
    userId: v.id("users"),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find existing session for user (active)
    let session = await ctx.db.query("sessions").withIndex("by_user", (q) => q.eq("userId", args.userId)).first();
    const now = Date.now();
    if (session) {
      await ctx.db.patch(session._id, {
        lastActive: now,
        ip: args.ip,
        userAgent: args.userAgent,
        isActive: args.isActive,
      });
    } else {
      await ctx.db.insert("sessions", {
        userId: args.userId,
        createdAt: now,
        lastActive: now,
        ip: args.ip,
        userAgent: args.userAgent,
        isActive: args.isActive,
      });
    }
    return null;
  },
});

// Query all sessions (admin only)
export const getAllSessions = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("sessions"),
      userId: v.id("users"),
      createdAt: v.number(),
      lastActive: v.number(),
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    return await ctx.db.query("sessions").order("desc").collect();
  },
});

// Log an error
export const logError = mutation({
  args: {
    level: v.string(),
    message: v.string(),
    functionName: v.optional(v.string()),
    stack: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("errorLogs", {
      timestamp: Date.now(),
      level: args.level,
      message: args.message,
      functionName: args.functionName,
      stack: args.stack,
    });
    return null;
  },
});

// Query error logs (admin only)
export const getErrorLogs = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("errorLogs"),
      timestamp: v.number(),
      level: v.string(),
      message: v.string(),
      functionName: v.optional(v.string()),
      stack: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Admin access required");
    }
    return await ctx.db.query("errorLogs").order("desc").take(100);
  },
});
