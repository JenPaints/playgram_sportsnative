"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { api } from "./_generated/api";

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  studentName: string;
  studentEmail: string;
  sportName: string;
  batchName: string;
  amount: number;
  transactionId: string;
  status: string;
}

// Helper to sanitize text to ASCII (replace non-ASCII with 'Rs.')
function toAscii(text: string): string {
  return text.replace(/[^\x00-\x7F]/g, 'Rs.');
}

export const generateInvoicePDF = action({
  args: {
    invoiceId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch enriched payment details
      const invoice = await ctx.runQuery(api.payments.getPaymentDetails, {
        paymentId: args.invoiceId,
      });

      if (!invoice) {
        throw new Error("Invoice not found for paymentId: " + args.invoiceId);
      }

      // Get user data
      const user = await ctx.runQuery(api.users.getUser, {
        id: invoice.userId,
      });

      if (!user) {
        throw new Error("User not found for userId: " + invoice.userId);
      }

      // Get enrollment data
      const enrollment = await ctx.runQuery(api.enrollments.getEnrollment, {
        id: invoice.enrollmentId,
      });

      if (!enrollment) {
        throw new Error("Enrollment not found for enrollmentId: " + invoice.enrollmentId);
      }

      // Get sport data
      const sport = await ctx.runQuery(api.sports.getSport, {
        sportId: enrollment.sportId,
      });

      if (!sport) {
        throw new Error("Sport not found for sportId: " + enrollment.sportId);
      }

      // Get batch data
      const batch = await ctx.runQuery(api.batches.getBatch, {
        batchId: enrollment.batchId,
      });

      if (!batch) {
        throw new Error("Batch not found for batchId: " + enrollment.batchId);
      }

      // Generate PDF with pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let y = 800;
      const left = 50;
      const lineHeight = 24;
      page.drawText(toAscii("PlayGram Sports"), { x: left, y, size: 20, font, color: rgb(0,0,0) });
      y -= lineHeight * 1.5;
      page.drawText(toAscii("INVOICE"), { x: left, y, size: 16, font, color: rgb(0,0,0) });
      y -= lineHeight * 1.5;
      page.drawText(toAscii(`Invoice Number: INV-${invoice._id}`), { x: left, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(`Date: ${new Date(invoice._creationTime).toLocaleDateString()}`), { x: left, y, size: 12, font });
      y -= lineHeight * 1.5;
      page.drawText(toAscii("Bill To:"), { x: left, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(user.name || "N/A"), { x: left + 20, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(user.email || "N/A"), { x: left + 20, y, size: 12, font });
      y -= lineHeight * 1.5;
      page.drawText(toAscii("Details:"), { x: left, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(`Sport: ${sport.name}`), { x: left + 20, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(`Batch: ${batch.name}`), { x: left + 20, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(`Amount: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.amount)}`), { x: left + 20, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(`Transaction ID: ${invoice.transactionId || "N/A"}`), { x: left + 20, y, size: 12, font });
      y -= lineHeight;
      page.drawText(toAscii(`Status: ${invoice.status.toUpperCase()}`), { x: left + 20, y, size: 12, font });
      y -= lineHeight * 2;
      page.drawText(toAscii("Thank you for your business!"), { x: left, y, size: 12, font });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const storageId = await ctx.storage.store(pdfBlob);
      return {
        storageId,
        url: await ctx.storage.getUrl(storageId),
      };
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new Error("Failed to generate PDF");
    }
  },
});