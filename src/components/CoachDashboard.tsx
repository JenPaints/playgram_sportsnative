import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { SignOutButton } from "../SignOutButton";
import LoadingSpinner from "./ui/LoadingSpinner";
import { QRScanner } from "./coach/QRScanner";
import { BatchManagement } from "./coach/BatchManagement";
import { AttendanceHistory } from "./coach/AttendanceHistory";
import { Menu } from "lucide-react";

interface CoachDashboardProps {
  user: any;
}

const tabs = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "attendance", label: "Mark Attendance", icon: "✅" },
  { id: "batches", label: "My Batches", icon: "👥" },
  { id: "history", label: "Attendance History", icon: "📋" },
];

export function CoachDashboard({ user }: CoachDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profile = useQuery(api.users.getCurrentProfile);
  const batches = useQuery(api.batches.getCoachBatches);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 gap-2 sm:gap-0">
            <div className="flex items-center space-x-4 w-full">
              {/* Hamburger for mobile */}
              <button
                className="sm:hidden mr-2 p-2 rounded hover:bg-gray-800 focus:outline-none"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Open sidebar"
              >
                <Menu size={24} className="text-white" />
              </button>
              <motion.h1 
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                PlayGram Coach
              </motion.h1>
              <div className="hidden sm:block">
                <span className="text-gray-400">Coach </span>
                <span className="text-white font-semibold">
                  {profile.profile?.firstName} {profile.profile?.lastName}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-gray-400">Active Batches</div>
                <div className="text-lg font-bold text-blue-400">
                  {batches?.length || 0}
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar Navigation */}
        {/* Desktop Sidebar */}
        <motion.nav 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-700 min-h-screen p-4 flex-col"
        >
          <div className="space-y-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.nav>
        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-700 min-h-screen p-4 flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-bold text-lg">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded hover:bg-gray-800 focus:outline-none text-white">✕</button>
              </div>
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setSidebarOpen(false)} />
          </div>
        )}
        {/* Main Content */}
        <main className="flex-1 w-full p-2 sm:p-4 md:p-6 overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "overview" && <CoachOverviewTab profile={profile} batches={batches} />}
              {activeTab === "attendance" && <QRScanner />}
              {activeTab === "batches" && <BatchManagement />}
              {activeTab === "history" && <AttendanceHistory />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function CoachOverviewTab({ profile, batches }: { profile: any; batches: any }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white"
      >
        <h2 className="text-3xl font-bold mb-2">
          Welcome back, Coach {profile.profile?.firstName}! 👨‍🏫
        </h2>
        <p className="text-green-100 text-lg">
          Ready to inspire your students today?
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Batches</p>
              <p className="text-2xl font-bold text-blue-400">{batches?.length || 0}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-green-400">
                {batches?.reduce((total: number, batch: any) => total + (batch.currentStudents || 0), 0) || 0}
              </p>
            </div>
            <div className="text-3xl">🎓</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Week</p>
              <p className="text-2xl font-bold text-purple-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Mark Attendance", icon: "✅", color: "from-green-500 to-emerald-600" },
            { label: "Generate QR", icon: "📱", color: "from-blue-500 to-cyan-600" },
            { label: "View Students", icon: "👥", color: "from-purple-500 to-pink-600" },
            { label: "Attendance History", icon: "📋", color: "from-yellow-500 to-orange-600" },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-gradient-to-r ${action.color} p-4 rounded-xl text-white font-semibold text-center`}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm">{action.label}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
