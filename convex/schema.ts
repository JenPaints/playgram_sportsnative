import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    // ...other fields as needed...
  })
    .index("email", ["email"])
    .index("by_phone", ["phone"]),

  profiles: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("coach"), v.literal("admin")),
    sessionId: v.string(),
    isActive: v.boolean(),
    subscriptionStatus: v.union(v.literal("active"), v.literal("pending"), v.literal("expired")),
    totalPoints: v.number(),
    level: v.number(),
    joinedAt: v.number(),
    photoUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_phone", ["phone"]),

  sports: defineTable({
    name: v.string(),
    description: v.string(),
    isActive: v.boolean(),
    maxStudentsPerBatch: v.number(),
    pricePerMonth: v.number(),
    equipment: v.array(v.string()),
    ageGroups: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    razorpayPlanId: v.optional(v.string()),
  }),

  batches: defineTable({
    name: v.string(),
    sportId: v.id("sports"),
    coachId: v.optional(v.id("users")),
    schedule: v.object({
      days: v.array(v.string()),
      startTime: v.string(),
      endTime: v.string(),
    }),
    maxStudents: v.number(),
    currentStudents: v.number(),
    ageGroup: v.string(),
    level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    venue: v.string(),
    isActive: v.boolean(),
    startDate: v.number(),
  })
    .index("by_sport", ["sportId"])
    .index("by_coach", ["coachId"]),

  enrollments: defineTable({
    userId: v.id("users"),
    batchId: v.id("batches"),
    sportId: v.id("sports"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("completed")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("overdue")),
    enrolledAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_batch", ["batchId"])
    .index("by_user_batch", ["userId", "batchId"]),

  attendance: defineTable({
    userId: v.id("users"),
    batchId: v.id("batches"),
    date: v.string(),
    isPresent: v.boolean(),
    method: v.union(v.literal("qr"), v.literal("manual")),
    notes: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_batch", ["batchId"])
    .index("by_user_batch", ["userId", "batchId"])
    .index("by_batch_date", ["batchId", "date"])
    .index("by_user_batch_date", ["userId", "batchId", "date"]),

  attendanceSessions: defineTable({
    batchId: v.id("batches"),
    coachId: v.id("users"),
    date: v.string(),
    code: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_code", ["code"]),

  pointsHistory: defineTable({
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  payments: defineTable({
    userId: v.id("users"),
    enrollmentId: v.id("enrollments"),
    amount: v.float64(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("attempted")),
    method: v.string(),
    transactionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    notes: v.optional(v.string()),
    paymentDate: v.optional(v.number()),
    receiptNumber: v.optional(v.string()),
    paymentPeriod: v.optional(v.string()),
    refunded: v.optional(v.boolean()),
    refundAmount: v.optional(v.float64()),
    refundReason: v.optional(v.string()),
    refundDate: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_enrollment", ["enrollmentId"])
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"])
    .index("by_payment_date", ["paymentDate"]),

  // Products table for merchandise management
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.float64(),
    imageUrl: v.optional(v.string()),
    stock: v.float64(),
    isActive: v.boolean(),
  }),

  // Slides table for home page slides
  slides: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  }),

  // Content table for dynamic content
  content: defineTable({
    key: v.string(),
    value: v.string(),
    type: v.union(v.literal("text"), v.literal("html"), v.literal("markdown")),
    isActive: v.boolean(),
  }),

  // Messaging tables
  channels: defineTable({
    name: v.string(),
    type: v.union(v.literal("direct"), v.literal("group"), v.literal("broadcast")),
    members: v.array(v.id("users")),
    createdAt: v.number(),
  }),
  messages: defineTable({
    channelId: v.id("channels"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("notification")),
    createdAt: v.number(),
  }).index("by_channel", ["channelId"]),

  rewards: defineTable({
    name: v.string(),
    type: v.union(v.literal("milestone"), v.literal("scratch_card")),
    points: v.number(),
    description: v.string(),
    isActive: v.boolean(),
  }),
  rewardHistory: defineTable({
    userId: v.id("users"),
    rewardId: v.id("rewards"),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Orders table for merchandise purchases
  orders: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    amount: v.float64(),
    paymentId: v.optional(v.id("payments")),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("ready_for_pickup"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    pickupSession: v.optional(v.string()), // e.g., next session info
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  otps: defineTable({
    contact: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    method: v.union(v.literal("phone"), v.literal("email")),
  }).index("by_contact_and_method", ["contact", "method"]),

  passwordResets: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  }),

  auditLogs: defineTable({
    adminUserId: v.id("users"),
    action: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_admin", ["adminUserId"]),

  settings: defineTable({
    maintenanceMode: v.optional(v.boolean()),
    announcement: v.optional(v.string()),
  }),

  sessions: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
    lastActive: v.number(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  errorLogs: defineTable({
    timestamp: v.number(),
    level: v.string(),
    message: v.string(),
    functionName: v.optional(v.string()),
    stack: v.optional(v.string()),
  }).index("by_time", ["timestamp"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    batchId: v.id("batches"),
    sportId: v.id("sports"),
    razorpaySubscriptionId: v.string(),
    status: v.string(), // e.g., 'created', 'active', 'cancelled'
    startDate: v.number(),
    endDate: v.optional(v.number()),
    planId: v.string(),
    amount: v.number(),
    currency: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_batch", ["batchId"])
    .index("by_sport", ["sportId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
