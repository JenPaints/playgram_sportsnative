import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { toast } from "sonner";
import { useState } from "react";

export function BatchManagement() {
  const batches = useQuery(api.batches.getCoachBatches);
  const generateQR = useMutation(api.attendance.generateAttendanceQR);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);

  const handleGenerateQR = async (batchId: string) => {
    setGeneratingQR(batchId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await generateQR({ batchId: batchId as any, date: today });
      toast.success(`QR Code generated: ${result.code}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate QR code");
    } finally {
      setGeneratingQR(null);
    }
  };

  if (batches === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Batches Assigned</h3>
        <p className="text-gray-400">
          You don't have any batches assigned yet. Contact admin to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Batches</h2>
        <div className="text-sm text-gray-400">
          {batches.length} batch{batches.length !== 1 ? 'es' : ''} assigned
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {batches.map((batch, index) => (
          <motion.div
            key={batch._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{batch.name}</h3>
                <p className="text-gray-400">{batch.sport?.name}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                batch.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
              }`}>
                {batch.isActive ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Schedule:</span>
                <span className="text-white">
                  {batch.schedule.days.join(", ")}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time:</span>
                <span className="text-white">
                  {batch.schedule.startTime} - {batch.schedule.endTime}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Venue:</span>
                <span className="text-white">{batch.venue}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Students:</span>
                <span className="text-white">
                  {batch.currentStudents}/{batch.maxStudents}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Level:</span>
                <span className="text-white capitalize">{batch.level}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Age Group:</span>
                <span className="text-white">{batch.ageGroup}</span>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGenerateQR(batch._id)}
                disabled={generatingQR === batch._id}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {generatingQR === batch._id ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  "Generate QR Code"
                )}
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  View Students
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Attendance
                </motion.button>
              </div>
            </div>

            {batch.students && batch.students.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Students</h4>
                <div className="space-y-1">
                  {batch.students.slice(0, 3).map((student: any) => (
                    <div key={student._id} className="text-sm text-gray-400">
                      {student.profile?.firstName} {student.profile?.lastName}
                    </div>
                  ))}
                  {batch.students.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{batch.students.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
