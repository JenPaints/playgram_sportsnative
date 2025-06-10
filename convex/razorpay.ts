"use node";

import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import Razorpay from "razorpay";
import crypto from "crypto"; // Import crypto module

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

// Create a Razorpay order
export const createRazorpayOrder = action({
  args: {
    amount: v.number(),
    currency: v.string(),
    receipt: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const instance = getRazorpayInstance();
      const order = await instance.orders.create({
        amount: args.amount,
        currency: args.currency,
        receipt: args.receipt,
        payment_capture: true,
      });
      return order;
    } catch (error) {
      // Log the entire error object for debugging
      try {
        console.error("Razorpay order creation error (full):", JSON.stringify(error));
      } catch (e) {
        console.error("Razorpay order creation error (raw):", error);
      }
      let details = "";
      if (error && typeof error === "object") {
        if ("message" in error) details += `\nMessage: ${(error as any).message}`;
        if ("stack" in error) details += `\nStack: ${(error as any).stack}`;
        if ("error" in error) details += `\nError: ${JSON.stringify((error as any).error)}`;
        if ("response" in error) details += `\nResponse: ${JSON.stringify((error as any).response)}`;
      }
      // Add the raw error object as a string if nothing else
      if (!details) {
        details = `\nRaw error: ${String(error)}`;
      }
      throw new Error(`Failed to create Razorpay order:${details}`);
    }
  },
});

// Verify Razorpay payment
export const verifyRazorpayPayment = action({
  args: {
    razorpay_payment_id: v.string(),
    razorpay_order_id: v.string(),
    razorpay_signature: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Ensure keySecret is available for verification
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new Error("Razorpay API key secret is not configured for verification.");
      }

      const body = args.razorpay_order_id + "|" + args.razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

      const isAuthentic = expectedSignature === args.razorpay_signature;

      return {
        verified: isAuthentic,
      };
    } catch (error) {
      console.error("Razorpay payment verification error:", error);
      throw new Error("Failed to verify Razorpay payment");
    }
  },
});