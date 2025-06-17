"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendOtpWhatsApp = internalAction({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const fetch = (await import("node-fetch")).default;
    const token = process.env.WHATSAPP_TOKEN!;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: args.phone,
      type: "template",
      template: {
        name: "your_otp_template", // Replace with your approved template name
        language: { code: "en_US" },
        components: [
          { type: "body", parameters: [{ type: "text", text: args.code }] },
        ],
      },
    };
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return null;
  },
});

export const sendOtpEmail = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const fetch = (await import("node-fetch")).default;
    // Example: Use SendGrid API (or any email provider)
    const sendgridApiKey = process.env.SENDGRID_API_KEY!;
    const url = "https://api.sendgrid.com/v3/mail/send";
    const body = {
      personalizations: [{ to: [{ email: args.email }] }],
      from: { email: "no-reply@yourdomain.com", name: "PlayGram" },
      subject: "Your OTP Code",
      content: [
        { type: "text/plain", value: `Your OTP code is: ${args.code}` },
      ],
    };
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return null;
  },
});

export const sendPasswordResetEmail = internalAction({
  args: { email: v.string(), resetUrl: v.string() },
  handler: async (ctx, args) => {
    const fetch = (await import("node-fetch")).default;
    const sendgridApiKey = process.env.SENDGRID_API_KEY!;
    const url = "https://api.sendgrid.com/v3/mail/send";
    const body = {
      personalizations: [{ to: [{ email: args.email }] }],
      from: { email: "no-reply@yourdomain.com", name: "PlayGram" },
      subject: "Reset your PlayGram password",
      content: [
        { type: "text/plain", value: `Click the link to reset your password: ${args.resetUrl}\nIf you did not request this, ignore this email.` },
      ],
    };
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return null;
  },
}); 