import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Generate QR code for attendance
export const generateAttendanceQR = mutation({
  args: {
    batchId: v.id("batches"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "coach") {
      throw new Error("Coach access required");
    }

    // Verify coach owns this batch
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.coachId !== userId) {
      throw new Error("Access denied");
    }

    // Generate unique QR code
    const code = `${args.batchId}_${args.date}_${Date.now()}`;
    
    // Store QR session
    const sessionId = await ctx.db.insert("attendanceSessions", {
      batchId: args.batchId,
      coachId: userId,
      date: args.date,
      code,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
    });

    return { success: true, code, sessionId };
  },
});

// Mark attendance via QR scan
export const markAttendanceByQR = mutation({
  args: {
    qrCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "student") {
      throw new Error("Student access required");
    }

    // Find active session
    const session = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_code", (q) => q.eq("code", args.qrCode))
      .first();

    if (!session || !session.isActive || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired QR code");
    }

    // Check if student is enrolled in this batch
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_user_batch", (q) => 
        q.eq("userId", userId).eq("batchId", session.batchId)
      )
      .first();

    if (!enrollment) {
      throw new Error("Not enrolled in this batch");
    }

    // Check if already marked present today
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user_batch_date", (q) => 
        q.eq("userId", userId)
         .eq("batchId", session.batchId)
         .eq("date", session.date)
      )
      .first();

    if (existingAttendance) {
      throw new Error("Attendance already marked for today");
    }

    // Mark attendance
    const attendanceId = await ctx.db.insert("attendance", {
      userId,
      batchId: session.batchId,
      date: session.date,
      isPresent: true,
      method: "qr",
      timestamp: Date.now(),
    });

    // Award points for attendance
    await ctx.runMutation(api.users.addPoints, {
      userId,
      points: 10,
      reason: "Attendance",
    });

    // Get student details to return
    const studentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const batch = await ctx.db.get(session.batchId);
    const sport = batch ? await ctx.db.get(batch.sportId) : null;

    return { 
      success: true, 
      attendanceId,
      student: {
        name: `${studentProfile?.firstName} ${studentProfile?.lastName}`,
        userId: userId,
      },
      batch: {
        name: batch?.name,
        sport: sport?.name,
      }
    };
  },
});

// Mark attendance by coach scanning student QR
export const markAttendanceByCoachScan = mutation({
  args: {
    studentQRCode: v.string(),
  },
  handler: async (ctx, args) => {
    const coachUserId = await getAuthUserId(ctx);
    if (!coachUserId) throw new Error("Not authenticated");

    const coachProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", coachUserId))
      .first();

    if (!coachProfile || coachProfile.role !== "coach") {
      throw new Error("Coach access required");
    }

    // Parse student QR code (format: studentId_sessionId)
    const [studentId, sessionId] = args.studentQRCode.split('_');
    if (!studentId || !sessionId) {
      throw new Error("Invalid QR code format");
    }

    // Get student profile
    const studentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", studentId as any))
      .first();

    if (!studentProfile) {
      throw new Error("Student not found");
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find coach's active batches for today
    const coachBatches = await ctx.db
      .query("batches")
      .withIndex("by_coach", (q) => q.eq("coachId", coachUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Find which batch the student is enrolled in that the coach teaches
    let targetBatch = null;
    let targetEnrollment = null;

    for (const batch of coachBatches) {
      const enrollment = await ctx.db
        .query("enrollments")
        .withIndex("by_user_batch", (q) => 
          q.eq("userId", studentId as any).eq("batchId", batch._id)
        )
        .first();

      if (enrollment && enrollment.status === "active") {
        targetBatch = batch;
        targetEnrollment = enrollment;
        break;
      }
    }

    if (!targetBatch || !targetEnrollment) {
      throw new Error("Student not enrolled in any of your active batches");
    }

    // Check if already marked present today
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user_batch_date", (q) => 
        q.eq("userId", studentId as any)
         .eq("batchId", targetBatch._id)
         .eq("date", today)
      )
      .first();

    if (existingAttendance) {
      throw new Error("Attendance already marked for this student today");
    }

    // Mark attendance
    const attendanceId = await ctx.db.insert("attendance", {
      userId: studentId as any,
      batchId: targetBatch._id,
      date: today,
      isPresent: true,
      method: "qr",
      timestamp: Date.now(),
    });

    // Award points for attendance
    await ctx.runMutation(api.users.addPoints, {
      userId: studentId as any,
      points: 10,
      reason: "Attendance",
    });

    // Get sport details
    const sport = await ctx.db.get(targetBatch.sportId);

    return { 
      success: true, 
      attendanceId,
      student: {
        name: `${studentProfile.firstName} ${studentProfile.lastName}`,
        userId: studentId,
        points: studentProfile.totalPoints + 10,
      },
      batch: {
        name: targetBatch.name,
        sport: sport?.name,
      }
    };
  },
});

// Mark attendance manually (coach)
export const markAttendanceManually = mutation({
  args: {
    studentId: v.id("users"),
    batchId: v.id("batches"),
    date: v.string(),
    isPresent: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "coach") {
      throw new Error("Coach access required");
    }

    // Verify coach owns this batch
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.coachId !== userId) {
      throw new Error("Access denied");
    }

    // Check if already marked
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user_batch_date", (q) => 
        q.eq("userId", args.studentId)
         .eq("batchId", args.batchId)
         .eq("date", args.date)
      )
      .first();

    if (existingAttendance) {
      // Update existing record
      await ctx.db.patch(existingAttendance._id, {
        isPresent: args.isPresent,
        notes: args.notes,
        timestamp: Date.now(),
      });
    } else {
      // Create new record
      await ctx.db.insert("attendance", {
        userId: args.studentId,
        batchId: args.batchId,
        date: args.date,
        isPresent: args.isPresent,
        method: "manual",
        notes: args.notes,
        timestamp: Date.now(),
      });
    }

    // Award points if present
    if (args.isPresent) {
      await ctx.runMutation(api.users.addPoints, {
        userId: args.studentId,
        points: 10,
        reason: "Attendance",
      });
    }

    return { success: true };
  },
});

// Get batch attendance for a date
export const getBatchAttendance = query({
  args: {
    batchId: v.id("batches"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_batch_date", (q) => 
        q.eq("batchId", args.batchId).eq("date", args.date)
      )
      .collect();

    const enrichedAttendance = await Promise.all(
      attendance.map(async (record) => {
        const studentProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", record.userId))
          .first();
        
        const student = await ctx.db.get(record.userId);

        return {
          ...record,
          student: {
            ...student,
            profile: studentProfile,
          },
        };
      })
    );

    return enrichedAttendance;
  },
});

// Get student attendance history
export const getStudentAttendance = query({
  args: {
    studentId: v.id("users"),
    batchId: v.id("batches"),
  },
  handler: async (ctx, args) => {
    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_user_batch", (q) =>
        q.eq("userId", args.studentId).eq("batchId", args.batchId)
      )
      .collect();
    return attendanceRecords;
  },
});

// Get attendance statistics
export const getAttendanceStats = query({
  args: {
    batchId: v.optional(v.id("batches")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    let attendance;

    if (args.batchId && args.userId) {
      attendance = await ctx.db
        .query("attendance")
        .withIndex("by_user_batch", (q) => 
          q.eq("userId", args.userId!).eq("batchId", args.batchId!)
        )
        .collect();
    } else if (args.batchId) {
      attendance = await ctx.db
        .query("attendance")
        .withIndex("by_batch", (q) => q.eq("batchId", args.batchId!))
        .collect();
    } else if (args.userId) {
      attendance = await ctx.db
        .query("attendance")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      attendance = await ctx.db.query("attendance").collect();
    }

    const totalSessions = attendance.length;
    const presentSessions = attendance.filter(record => record.isPresent).length;
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      presentSessions,
      absentSessions: totalSessions - presentSessions,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
  },
});

export const listAllAttendance = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("attendance"),
      userId: v.id("users"),
      batchId: v.id("batches"),
      date: v.string(),
      isPresent: v.boolean(),
      method: v.union(v.literal("qr"), v.literal("manual")),
      notes: v.optional(v.string()),
      timestamp: v.number(),
      _creationTime: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("attendance").order("desc").collect();
  },
});

// List attendance records with filtering and enrichment
export const listAttendance = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    batchId: v.optional(v.id("batches")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("attendance");

    if (args.startDate && args.endDate) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), args.startDate!),
          q.lte(q.field("timestamp"), args.endDate!)
        )
      );
    }

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    if (args.batchId) {
      query = query.filter((q) => q.eq(q.field("batchId"), args.batchId));
    }

    const attendanceRecords = await query.collect();

    const enrichedAttendance = await Promise.all(
      attendanceRecords.map(async (record) => {
        // Get profile using the by_user index
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", record.userId))
          .first();

        // Get user to access email
        const user = await ctx.db.get(record.userId);

        const batch = await ctx.db.get(record.batchId);
        const sport = batch ? await ctx.db.get(batch.sportId) : null;

        return {
          ...record,
          user: {
            name: profile ? `${profile.firstName} ${profile.lastName}` : 'N/A',
            userId: record.userId,
            email: user?.email || 'N/A',
            phone: profile?.phone || 'N/A',
          },
          batch: {
            name: batch?.name || 'N/A',
          },
          sport: {
            name: sport?.name || 'N/A',
          },
        };
      })
    );

    return enrichedAttendance;
  },
});

// Mark attendance (called by coach)
export const markAttendance = mutation({
  args: {
    sessionId: v.id("attendance_sessions"),
    studentId: v.id("students"),
    status: v.string(), // "present"
  },
  handler: async (ctx, args) => {
    // Check if already marked
    const existing = await ctx.db
      .query("attendance_records")
      .withIndex("by_session_and_student", q =>
        q.eq("sessionId", args.sessionId).eq("studentId", args.studentId)
      )
      .unique();
    if (existing) throw new Error("Already marked");

    // Mark attendance
    await ctx.db.insert("attendance_records", {
      sessionId: args.sessionId,
      studentId: args.studentId,
      status: args.status,
      timestamp: Date.now(),
    });

    // Award points if present
    if (args.status === "present") {
      const student = await ctx.db.get(args.studentId);
      await ctx.db.patch(args.studentId, {
        totalPoints: (student?.totalPoints ?? 0) + 10,
      });
    }
    return null;
  },
});

// Create a new attendance session (for a batch, on a date)
export const createAttendanceSession = mutation({
  args: {
    batchId: v.id("batches"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate session for same batch/date
    const existing = await ctx.db
      .query("attendance_sessions")
      .withIndex("by_batch_and_date", q =>
        q.eq("batchId", args.batchId).eq("date", args.date)
      )
      .unique();
    if (existing) throw new Error("Session already exists for this batch and date");
    return await ctx.db.insert("attendance_sessions", args);
  },
});

// Query for admin report
export const getAttendanceReport = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    // Get all sessions for the date
    const sessions = await ctx.db
      .query("attendance_sessions")
      .withIndex("by_date", q => q.eq("date", args.date))
      .collect();
    // For each session, get attendance
    // ...aggregate as needed
    return sessions;
  },
});
