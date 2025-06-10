"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSubscriptionInternal = internalAction({
  args: {
    batchId: v.id("batches"),
    sportId: v.id("sports"),
  },
  handler: async (ctx, args): Promise<any> => {
    // 1. Get user info
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    console.log("DEBUG userId", userId, typeof userId);

    // 2. Get batch and sport info
    const batch: any = await ctx.runQuery(api.batches.getBatch, { batchId: args.batchId });
    const sport: any = await ctx.runQuery(api.sports.getSport, { sportId: args.sportId });
    if (!batch || !sport) throw new Error("Batch or sport not found");

    // 3. Prepare Razorpay API
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) throw new Error("Razorpay credentials not set");
    const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");
    const fetch = (await import("node-fetch")).default;

    // 4. Create or get plan (for simplicity, use sport.razorpayPlanId if exists)
    let planId: any = sport.razorpayPlanId;
    if (!planId) {
      // Create plan
      const planRes = await fetch("https://api.razorpay.com/v1/plans", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: "monthly",
          interval: 1,
          item: {
            name: `${sport.name} Subscription`,
            amount: Math.round(sport.pricePerMonth * 100), // in paise
            currency: "INR",
            description: sport.description || "Subscription plan",
          },
        }),
      });
      const planData: any = await planRes.json();
      if (!planRes.ok) throw new Error(planData.error?.description || "Failed to create plan");
      planId = planData.id;
      // Store planId in sport for future use
      await ctx.runMutation(internal.sports.patchSport, { sportId: sport._id, razorpayPlanId: planId });
    }

    // 5. Create subscription
    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12, // 12 months
        quantity: 1,
        notes: {
          batch: batch.name,
          sport: sport.name,
        },
      }),
    });
    const subData: any = await subRes.json();
    if (!subRes.ok) throw new Error(subData.error?.description || "Failed to create subscription");

    // 6. Store subscription in DB
    await ctx.runMutation(internal.razorpay_mutations.insertSubscription, {
      userId,
      batchId: args.batchId,
      sportId: args.sportId,
      razorpaySubscriptionId: subData.id,
      status: subData.status,
      startDate: Date.now(),
      planId,
      amount: sport.pricePerMonth,
      currency: "INR",
    });

    // 7. Return subscription info for Razorpay Checkout
    return {
      subscriptionId: subData.id,
      key: key_id,
      planId,
      amount: sport.pricePerMonth,
      currency: "INR",
      batchName: batch.name,
      sportName: sport.name,
    };
  },
}); 