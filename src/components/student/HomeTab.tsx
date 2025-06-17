import { motion } from "framer-motion";
import { Award, BadgePercent, Bolt, Calendar, CheckCircle2, Dumbbell, Heart, Medal, Smile, Star, Trophy, User2, Users, ArrowRight } from "lucide-react";

function HomeTab({ profile, enrollments, attendanceData, onNavigate }: { 
  profile: any; 
  enrollments: any; 
  attendanceData: any;
  onNavigate?: (tab: string) => void;
}) {
  // Calculate stats
  const activeBatches = enrollments?.filter((e: any) => e.status === "active") || [];
  const totalPoints = profile?.totalPoints || 0;
  const level = profile?.level || 1;
  const filteredAttendance = attendanceData
    ? attendanceData.filter((a: any) => a.userId === profile?._id)
    : [];

  const totalSessions = filteredAttendance.length;
  const presentCount = filteredAttendance.filter((a: any) => a.isPresent).length;
  const absentCount = totalSessions - presentCount;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // Navigation handlers
  const handleNavigation = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-4">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6"
      >
        <div className="w-full md:w-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-2 sm:gap-3 drop-shadow-lg">
            <Smile size={28} className="sm:w-9 sm:h-9" /> Welcome, <span className="text-yellow-300">{profile?.firstName || "Student"}</span>!
          </h2>
          <p className="text-base sm:text-lg text-indigo-100 flex items-center gap-2">
            <ArrowRight size={18} className="sm:w-5 sm:h-5" /> Let's make today amazing!
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-pink-500/80 text-white font-bold flex items-center gap-2 shadow text-sm sm:text-base"><Award size={18} className="sm:w-5 sm:h-5" /> Points: <span className="font-extrabold text-yellow-200">{totalPoints}</span></span>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/80 text-white font-bold flex items-center gap-2 shadow text-sm sm:text-base"><Star size={18} className="sm:w-5 sm:h-5" /> Level: <span className="font-extrabold text-blue-200">{level}</span></span>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          className="bg-indigo-900/80 rounded-xl p-3 sm:p-4 md:p-6 border border-indigo-700 shadow flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigation('batches')}
        >
          <div className="text-3xl sm:text-4xl mb-1 sm:mb-2"><Users size={28} className="sm:w-9 sm:h-9 text-green-400" /></div>
          <div className="text-xl sm:text-2xl font-bold text-green-300">{activeBatches.length}</div>
          <div className="text-sm sm:text-base text-green-200 mt-1 font-medium">Active Batches</div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          className="bg-indigo-900/80 rounded-xl p-3 sm:p-4 md:p-6 border border-indigo-700 shadow flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigation('attendance')}
        >
          <div className="text-3xl sm:text-4xl mb-1 sm:mb-2"><Calendar size={28} className="sm:w-9 sm:h-9 text-yellow-400" /></div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-200">{presentCount} / {totalSessions}</div>
          <div className="text-sm sm:text-base text-yellow-100 mt-1 font-medium">Sessions Attended</div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          className="bg-indigo-900/80 rounded-xl p-3 sm:p-4 md:p-6 border border-indigo-700 shadow flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigation('attendance')}
        >
          <div className="text-3xl sm:text-4xl mb-1 sm:mb-2"><BadgePercent size={28} className="sm:w-9 sm:h-9 text-blue-400" /></div>
          <div className="text-xl sm:text-2xl font-bold text-blue-200">{attendanceRate}%</div>
          <div className="text-sm sm:text-base text-blue-100 mt-1 font-medium">Attendance Rate</div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          className="bg-indigo-900/80 rounded-xl p-3 sm:p-4 md:p-6 border border-indigo-700 shadow flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigation('leaderboard')}
        >
          <div className="text-3xl sm:text-4xl mb-1 sm:mb-2"><Trophy size={28} className="sm:w-9 sm:h-9 text-pink-400" /></div>
          <div className="text-xl sm:text-2xl font-bold text-pink-200">{totalPoints}</div>
          <div className="text-sm sm:text-base text-pink-100 mt-1 font-medium">Total Points</div>
        </motion.div>
      </div>

      {/* Active Batches List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/80 rounded-xl p-4 sm:p-6 border border-gray-800 shadow"
      >
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2"><Users size={20} className="sm:w-6 sm:h-6" /> Your Active Batches</h3>
        {activeBatches.length === 0 ? (
          <div className="text-indigo-200 text-sm sm:text-base">You are not enrolled in any batches yet.</div>
        ) : (
          <ul className="divide-y divide-indigo-800">
            {activeBatches.map((batch: any, idx: number) => (
              <motion.li 
                key={batch._id || idx} 
                className="py-2.5 sm:py-3 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-indigo-900/50 px-3 sm:px-4 rounded-lg transition-colors"
                onClick={() => handleNavigation('batches')}
              >
                <Dumbbell size={20} className="sm:w-6 sm:h-6 text-green-400" />
                <span className="font-semibold text-white text-sm sm:text-base">{batch.batchName || batch.name || "Batch"}</span>
                <span className="ml-auto px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-700/70 text-green-100 text-xs font-bold">Active</span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
      >
        <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2"><Bolt size={18} className="sm:w-5 sm:h-5" /> Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Browse Sports", icon: <Dumbbell size={18} className="sm:w-5 sm:h-5" />, color: "from-green-500 to-emerald-600", action: () => handleNavigation('sports') },
            { label: "View Schedule", icon: <Calendar size={18} className="sm:w-5 sm:h-5" />, color: "from-blue-500 to-cyan-600", action: () => handleNavigation('batches') },
            { label: "Check Leaderboard", icon: <Trophy size={18} className="sm:w-5 sm:h-5" />, color: "from-yellow-500 to-orange-600", action: () => handleNavigation('leaderboard') },
            { label: "Update Profile", icon: <User2 size={18} className="sm:w-5 sm:h-5" />, color: "from-purple-500 to-pink-600", action: () => handleNavigation('profile') },
          ].map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.color} p-3 sm:p-4 rounded-xl text-white font-semibold text-center flex flex-col items-center cursor-pointer`}
            >
              <div className="mb-1 sm:mb-2">{action.icon}</div>
              <div className="text-xs sm:text-sm">{action.label}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default HomeTab;