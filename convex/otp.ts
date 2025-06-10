import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const requestOtp = mutation({
  args: { contact: v.string(), method: v.union(v.literal("phone"), v.literal("email")) },
  handler: async (ctx, args) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await ctx.db.insert("otps", {
      contact: args.contact,
      code,
      expiresAt,
      used: false,
      method: args.method,
    });
    if (args.method === "phone") {
      await ctx.scheduler.runAfter(0, internal.otp_actions.sendOtpWhatsApp, { phone: args.contact, code });
    } else {
      await ctx.scheduler.runAfter(0, internal.otp_actions.sendOtpEmail, { email: args.contact, code });
    }
    return { success: true };
  },
});

export const verifyOtp = mutation({
  args: { contact: v.string(), code: v.string(), method: v.union(v.literal("phone"), v.literal("email")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const otp = await ctx.db
      .query("otps")
      .withIndex("by_contact_and_method", (q) =>
        q.eq("contact", args.contact).eq("method", args.method)
      )
      .order("desc")
      .first();
    if (!otp || otp.used || otp.code !== args.code || otp.expiresAt < now) {
      throw new Error("Invalid or expired OTP");
    }
    await ctx.db.patch(otp._id, { used: true });

    // Find or create user
    let user;
    if (args.method === "phone") {
      user = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", args.contact)).first();
    } else {
      user = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", args.contact)).first();
    }
    if (!user) {
      // Create user and profile
      const userId = await ctx.db.insert("users", {
        [args.method]: args.contact,
      });
      await ctx.db.insert("profiles", {
        userId,
        firstName: "",
        lastName: "",
        phone: args.method === "phone" ? args.contact : undefined,
        email: args.method === "email" ? args.contact : undefined,
        role: "student",
        sessionId: `${userId}_${Date.now()}`,
        isActive: true,
        subscriptionStatus: "pending",
        totalPoints: 0,
        level: 1,
        joinedAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }
    if (!user) {
      console.error("User creation failed for contact:", args.contact);
      throw new Error("User creation failed");
    }
    return user;
  },
}); 