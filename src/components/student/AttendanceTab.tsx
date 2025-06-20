import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import LoadingSpinner from "../ui/LoadingSpinner";
import { CalendarCheck2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function AttendanceTab({ user }: { user: any }) {
  const attendanceData = useQuery(api.attendance.listAllAttendance);
  const profile = useQuery(api.users.getCurrentProfile);

  if (!attendanceData || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter attendance data for current user
  const userAttendance = attendanceData.filter((a: any) => a.userId === profile.profile?._id);
  
  // Calculate attendance stats
  const totalSessions = userAttendance.length;
  const presentCount = userAttendance.filter((a: any) => a.isPresent).length;
  const absentCount = totalSessions - presentCount;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Attendance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <CalendarCheck2 size={32} /> Attendance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl mb-2"><CheckCircle2 size={36} className="text-green-400" /></div>
            <div className="text-2xl font-bold text-green-300">{presentCount}</div>
            <div className="text-green-200 mt-1 font-medium">Present</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl mb-2"><XCircle size={36} className="text-red-400" /></div>
            <div className="text-2xl font-bold text-red-300">{absentCount}</div>
            <div className="text-red-200 mt-1 font-medium">Absent</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl mb-2"><Clock size={36} className="text-blue-400" /></div>
            <div className="text-2xl font-bold text-blue-300">{totalSessions}</div>
            <div className="text-blue-200 mt-1 font-medium">Total Sessions</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl mb-2"><CalendarCheck2 size={36} className="text-purple-400" /></div>
            <div className="text-2xl font-bold text-purple-300">{attendanceRate}%</div>
            <div className="text-purple-200 mt-1 font-medium">Attendance Rate</div>
          </div>
        </div>
      </motion.div>

      {/* Attendance History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/80 rounded-xl p-6 border border-gray-800 shadow"
      >
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CalendarCheck2 size={24} /> Attendance History
        </h3>
        {userAttendance.length === 0 ? (
          <div className="text-indigo-200 text-center py-8">No attendance records found.</div>
        ) : (
          <div className="space-y-4">
            {userAttendance.map((record: any, index: number) => (
              <motion.div
                key={record._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${record.isPresent ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {record.isPresent ? (
                      <CheckCircle2 size={24} className="text-green-400" />
                    ) : (
                      <XCircle size={24} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {record.batchName || record.sportName || 'Session'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {format(new Date(record.date), 'MMMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  record.isPresent 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {record.isPresent ? 'Present' : 'Absent'}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
} 