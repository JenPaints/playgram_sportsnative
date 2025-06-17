import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Calendar, Settings, BarChart2, Activity } from 'lucide-react';
import { PerformanceMetrics } from './PerformanceMetrics';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full md:w-64 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
          >
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'overview' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <BarChart2 size={20} />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'users' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Users size={20} />
                <span>Users</span>
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'courses' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <BookOpen size={20} />
                <span>Courses</span>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'schedule' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Calendar size={20} />
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'settings' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </nav>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Overview</h2>
                
                {/* Performance Metrics */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
                  <PerformanceMetrics />
                </div>

                {/* Existing Overview Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* ... existing overview cards ... */}
                </div>
              </div>
            )}

            {/* ... rest of the existing tabs ... */}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 