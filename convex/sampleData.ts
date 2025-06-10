import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Sample data creation for testing
export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Create sample sports
    const footballId = await ctx.db.insert("sports", {
      name: "Football",
      description: "Learn the beautiful game with professional coaching. Develop your skills in passing, shooting, and teamwork.",
      isActive: true,
      maxStudentsPerBatch: 20,
      pricePerMonth: 2000,
      equipment: ["Football", "Cones", "Goals", "Bibs"],
      ageGroups: ["6-10", "11-15", "16-18", "Adults"],
    });

    const basketballId = await ctx.db.insert("sports", {
      name: "Basketball",
      description: "Master the fundamentals of basketball including dribbling, shooting, and defensive strategies.",
      isActive: true,
      maxStudentsPerBatch: 15,
      pricePerMonth: 2500,
      equipment: ["Basketball", "Hoops", "Cones", "Training Bibs"],
      ageGroups: ["8-12", "13-17", "Adults"],
    });

    const badmintonId = await ctx.db.insert("sports", {
      name: "Badminton",
      description: "Improve your badminton skills with expert coaching in technique, strategy, and fitness.",
      isActive: true,
      maxStudentsPerBatch: 12,
      pricePerMonth: 1800,
      equipment: ["Rackets", "Shuttlecocks", "Net", "Court markers"],
      ageGroups: ["10-14", "15-18", "Adults"],
    });

    // Create sample batches
    await ctx.db.insert("batches", {
      name: "Football Beginners",
      sportId: footballId,
      coachId: userId, // Using current user as coach for demo
      schedule: {
        days: ["monday", "wednesday", "friday"],
        startTime: "16:00",
        endTime: "17:30",
      },
      maxStudents: 20,
      currentStudents: 0,
      ageGroup: "6-10",
      level: "beginner",
      venue: "Main Football Ground",
      isActive: true,
      startDate: Date.now(),
    });

    await ctx.db.insert("batches", {
      name: "Basketball Intermediate",
      sportId: basketballId,
      coachId: userId,
      schedule: {
        days: ["tuesday", "thursday"],
        startTime: "17:00",
        endTime: "18:30",
      },
      maxStudents: 15,
      currentStudents: 0,
      ageGroup: "13-17",
      level: "intermediate",
      venue: "Indoor Basketball Court",
      isActive: true,
      startDate: Date.now(),
    });

    await ctx.db.insert("batches", {
      name: "Badminton Advanced",
      sportId: badmintonId,
      coachId: userId,
      schedule: {
        days: ["monday", "wednesday", "saturday"],
        startTime: "18:00",
        endTime: "19:30",
      },
      maxStudents: 12,
      currentStudents: 0,
      ageGroup: "Adults",
      level: "advanced",
      venue: "Badminton Hall A",
      isActive: true,
      startDate: Date.now(),
    });

    return { success: true, message: "Sample data created successfully!" };
  },
});
