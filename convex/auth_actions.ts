"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";
import { internal } from "./_generated/api";

export const requestPasswordResetAction = action({
  args: { email: v.string(), resetUrlBase: v.string() },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.runQuery(internal.users.getUserByEmail, { email: args.email });
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }
    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 1000 * 60 * 30; // 30 min
    const resetUrl = `${args.resetUrlBase}?token=${token}`;
    // Send email (reuse existing internal action)
    await ctx.runAction(internal.otp_actions.sendPasswordResetEmail, { email: args.email, resetUrl });
    // Insert into DB
    await ctx.runMutation(internal.auth.insertPasswordReset, {
      email: args.email,
      token,
      expiresAt,
    });
    return { success: true };
  },
}); 