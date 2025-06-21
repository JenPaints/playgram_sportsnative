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
    <div className="relative min-h-screen overflow-x-hidden pb-8">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-indigo-800 via-purple-900 to-pink-800 animate-gradient-move opacity-90 blur-sm"></div>
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-pink-400/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400/20 rounded-full filter blur-2xl animate-pulse"></div>
      </div>
      <div className="relative z-10 space-y-8 px-2 sm:px-4 pt-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-7 md:p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border border-white/20"
        >
          <div className="w-full md:w-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 flex items-center gap-3 drop-shadow-xl">
              <Smile size={36} className="sm:w-12 sm:h-12 text-yellow-300 animate-bounce" /> Welcome, <span className="text-yellow-300 animate-gradient-text bg-gradient-to-r from-yellow-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">{profile?.firstName || "Student"}</span>!
            </h2>
            <p className="text-lg sm:text-xl text-indigo-100 flex items-center gap-2">
              <ArrowRight size={22} className="sm:w-6 sm:h-6 animate-move-right" /> Let's make today amazing!
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <span className="px-4 py-2 rounded-full bg-pink-500/90 text-white font-bold flex items-center gap-2 shadow-lg text-base sm:text-lg backdrop-blur-md"><Award size={22} className="sm:w-6 sm:h-6 animate-spin-slow" /> Points: <span className="font-extrabold text-yellow-200 animate-pulse">{totalPoints}</span></span>
            <span className="px-4 py-2 rounded-full bg-blue-500/90 text-white font-bold flex items-center gap-2 shadow-lg text-base sm:text-lg backdrop-blur-md"><Star size={22} className="sm:w-6 sm:h-6 animate-wiggle" /> Level: <span className="font-extrabold text-blue-200 animate-pulse">{level}</span></span>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <motion.div 
            whileHover={{ scale: 1.06 }} 
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-green-400/30 shadow-xl flex flex-col items-center cursor-pointer transition-all hover:scale-105 hover:shadow-2xl"
            onClick={() => handleNavigation('batches')}
          >
            <div className="text-4xl sm:text-5xl mb-2"><Users size={32} className="sm:w-12 sm:h-12 text-green-400 animate-bounce" /></div>
            <div className="text-2xl sm:text-3xl font-bold text-green-200 animate-gradient-text">{activeBatches.length}</div>
            <div className="text-base sm:text-lg text-green-100 mt-1 font-medium">Active Batches</div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.06 }} 
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-yellow-400/30 shadow-xl flex flex-col items-center cursor-pointer transition-all hover:scale-105 hover:shadow-2xl"
            onClick={() => handleNavigation('attendance')}
          >
            <div className="text-4xl sm:text-5xl mb-2"><Calendar size={32} className="sm:w-12 sm:h-12 text-yellow-400 animate-pulse" /></div>
            <div className="text-2xl sm:text-3xl font-bold text-yellow-200 animate-gradient-text">{presentCount} / {totalSessions}</div>
            <div className="text-base sm:text-lg text-yellow-100 mt-1 font-medium">Sessions Attended</div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.06 }} 
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-blue-400/30 shadow-xl flex flex-col items-center cursor-pointer transition-all hover:scale-105 hover:shadow-2xl"
            onClick={() => handleNavigation('attendance')}
          >
            <div className="text-4xl sm:text-5xl mb-2"><BadgePercent size={32} className="sm:w-12 sm:h-12 text-blue-400 animate-wiggle" /></div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-200 animate-gradient-text">{attendanceRate}%</div>
            <div className="text-base sm:text-lg text-blue-100 mt-1 font-medium">Attendance Rate</div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.06 }} 
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-pink-400/30 shadow-xl flex flex-col items-center cursor-pointer transition-all hover:scale-105 hover:shadow-2xl"
            onClick={() => handleNavigation('leaderboard')}
          >
            <div className="text-4xl sm:text-5xl mb-2"><Trophy size={32} className="sm:w-12 sm:h-12 text-pink-400 animate-bounce" /></div>
            <div className="text-2xl sm:text-3xl font-bold text-pink-200 animate-gradient-text">{totalPoints}</div>
            <div className="text-base sm:text-lg text-pink-100 mt-1 font-medium">Total Points</div>
          </motion.div>
        </div>

        {/* Active Batches List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3"><Users size={24} className="sm:w-8 sm:h-8 animate-bounce text-green-400" /> Your Active Batches</h3>
          {activeBatches.length === 0 ? (
            <div className="text-indigo-200 text-base">You are not enrolled in any batches yet.</div>
          ) : (
            <ul className="divide-y divide-indigo-800">
              {activeBatches.map((batch: any, idx: number) => (
                <motion.li 
                  key={batch._id || idx} 
                  className="py-3 sm:py-4 flex items-center gap-4 cursor-pointer hover:bg-indigo-900/40 px-4 rounded-xl transition-colors"
                  onClick={() => handleNavigation('batches')}
                >
                  <Dumbbell size={24} className="sm:w-8 sm:h-8 text-green-400 animate-pulse" />
                  <span className="font-semibold text-white text-lg sm:text-xl">{batch.batchName || batch.name || "Batch"}</span>
                  <span className="ml-auto px-3 py-1 rounded-full bg-green-700/70 text-green-100 text-xs font-bold">Active</span>
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
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3"><Bolt size={22} className="sm:w-6 sm:h-6 animate-wiggle" /> Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Browse Sports", icon: <Dumbbell size={22} className="sm:w-6 sm:h-6 animate-bounce" />, color: "from-green-400 to-emerald-500", action: () => handleNavigation('sports') },
              { label: "View Schedule", icon: <Calendar size={22} className="sm:w-6 sm:h-6 animate-pulse" />, color: "from-blue-400 to-cyan-500", action: () => handleNavigation('batches') },
              { label: "Check Leaderboard", icon: <Trophy size={22} className="sm:w-6 sm:h-6 animate-bounce" />, color: "from-yellow-400 to-orange-500", action: () => handleNavigation('leaderboard') },
              { label: "Update Profile", icon: <User2 size={22} className="sm:w-6 sm:h-6 animate-wiggle" />, color: "from-purple-400 to-pink-500", action: () => handleNavigation('profile') },
            ].map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                onClick={action.action}
                className={`bg-gradient-to-r ${action.color} p-4 rounded-xl text-white font-semibold text-center flex flex-col items-center cursor-pointer shadow-lg border border-white/10 transition-all`}
              >
                <div className="mb-2">{action.icon}</div>
                <div className="text-sm sm:text-base">{action.label}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default HomeTab;