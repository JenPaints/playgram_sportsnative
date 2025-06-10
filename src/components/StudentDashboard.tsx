import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { SignOutButton } from "../SignOutButton";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { SportsGrid } from "./student/SportsGrid";
import { MyBatches } from "./student/MyBatches";
import { Leaderboard } from "./student/Leaderboard";
import { Profile } from "./student/Profile";
import { QRCodeDisplay } from "./student/QRCodeDisplay";
import MerchandiseTab from "./student/MerchandiseTab";
import {
  Home,
  Dumbbell,
  Users,
  Trophy,
  User,
  ShoppingCart,
  QrCode,
  Star,
  Award,
  BookOpen,
  Calendar,
  Edit,
  LogOut,
  ArrowRight,
  BadgePercent,
  Gift,
  Medal,
  BarChart2,
  CheckCircle2,
  UserCircle2,
  User2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Info,
  AlertTriangle,
  Smile,
  HeartHandshake,
  Heart,
  PlusCircle,
  Settings2,
  Shield,
  ClipboardList,
  ClipboardCheck,
  ClipboardX,
  ClipboardSignature,
  ClipboardEdit,
  Clipboard,
  CalendarDays,
  CalendarCheck2,
  CalendarX2,
  CalendarPlus,
  CalendarMinus,
  CalendarClock,
  CalendarHeart,
  Bolt,
  Menu
} from "lucide-react";
import gsap from 'gsap';
import { animate } from 'animejs';
import Hyperspeed from "./backgrounds/Hyperspeed";
import "./backgrounds/Hyperspeed.css";

interface StudentDashboardProps {
  user: any;
}

const tabs = [
  { id: "home", label: "Home", icon: <Home size={20} /> },
  { id: "sports", label: "Sports", icon: <Dumbbell size={20} /> },
  { id: "batches", label: "My Batches", icon: <Users size={20} /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={20} /> },
  { id: "merchandise", label: "Merchandise", icon: <ShoppingCart size={20} /> },
  { id: "profile", label: "Profile", icon: <User size={20} /> },
];

// Reusable GSAP entrance hook
function useGsapEntrance(ref: React.RefObject<HTMLElement | null>, options = {}) {
  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', ...options }
      );
    }
  }, [ref, options]);
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profile = useQuery(api.users.getCurrentProfile);
  const enrollments = useQuery(api.sports.getUserEnrollments);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useGsapEntrance(containerRef);

  // Sidebar animation logic
  useEffect(() => {
    if (activeTabRef.current) {
      gsap.to(activeTabRef.current, {
        boxShadow: '0 0 24px 4px #f43f5e',
        scale: 1.08,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, [activeTab]);

  // Animate sidebar icons on hover
  useEffect(() => {
    if (!sidebarRef.current) return;
    const icons = sidebarRef.current.querySelectorAll('.sidebar-icon');
    icons.forEach((icon) => {
      icon.addEventListener('mouseenter', () => {
        animate(icon, { scale: 1.2, rotate: '1turn', duration: 600, easing: 'easeOutElastic(1, .8)' });
      });
      icon.addEventListener('mouseleave', () => {
        animate(icon, { scale: 1, rotate: '0turn', duration: 400, easing: 'easeOutExpo' });
      });
    });
    return () => {
      icons.forEach((icon) => {
        icon.removeEventListener('mouseenter', () => {});
        icon.removeEventListener('mouseleave', () => {});
      });
    };
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0">
        <Hyperspeed />
      </div>
      <div ref={containerRef} className="relative z-10">
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
                  className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center gap-2"
                >
                  <Smile className="text-blue-400" size={28} /> PlayGram
                </motion.h1>
                <div className="hidden sm:block">
                  <span className="text-gray-400">Welcome back, </span>
                  <span className="text-white font-semibold">
                    {profile.profile?.firstName} {profile.profile?.lastName}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-gray-400 flex items-center gap-1"><Award size={14} /> Points</div>
                  <motion.div 
                    key={profile.profile?.totalPoints}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold text-yellow-400 flex items-center gap-1"
                  >
                    <BadgePercent size={16} /> {profile.profile?.totalPoints}
                  </motion.div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-gray-400 flex items-center gap-1"><Star size={14} /> Level</div>
                  <div className="text-lg font-bold text-blue-400 flex items-center gap-1"><Medal size={16} />{profile.profile?.level}</div>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </motion.header>

        <div className="flex">
          {/* Sidebar Navigation */}
          {/* Desktop Sidebar */}
          <nav ref={sidebarRef} className="hidden md:flex w-64 bg-gradient-to-b from-black via-blue-950 to-gray-900 border-r-2 border-blue-900 shadow-xl min-h-screen p-4 flex-col">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  ref={tab.id === activeTab ? activeTabRef : undefined}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    tab.id === activeTab
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </div>
            {/* QR Code Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-4 bg-gray-800 rounded-xl border border-gray-700"
            >
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><QrCode size={18} /> Your QR Code</h3>
              <QRCodeDisplay sessionId={profile.profile?.sessionId} />
            </motion.div>
          </nav>
          {/* Mobile Sidebar Drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="w-64 bg-gradient-to-b from-black via-blue-950 to-gray-900 border-r-2 border-blue-900 shadow-xl min-h-screen p-4 flex-col">
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
                      ref={tab.id === activeTab ? activeTabRef : undefined}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        tab.id === activeTab
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
                {/* QR Code Section */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 p-4 bg-gray-800 rounded-xl border border-gray-700"
                >
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><QrCode size={18} /> Your QR Code</h3>
                  <QRCodeDisplay sessionId={profile.profile?.sessionId} />
                </motion.div>
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
                {activeTab === "home" && <HomeTab profile={profile} enrollments={enrollments} />}
                {activeTab === "sports" && <SportsGrid />}
                {activeTab === "batches" && <MyBatches />}
                {activeTab === "leaderboard" && <Leaderboard />}
                {activeTab === "merchandise" && <MerchandiseTab />}
                {activeTab === "profile" && <Profile />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function HomeTab({ profile, enrollments }: { profile: any; enrollments: any }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Smile size={28} /> Welcome back, {profile.firstName}! <Heart className="text-pink-400" size={22} />
        </h2>
        <p className="text-blue-100 text-lg flex items-center gap-2">
          <ArrowRight size={18} /> Ready to level up your game today?
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
              <p className="text-gray-400 text-sm flex items-center gap-1"><Award size={14} /> Total Points</p>
              <p className="text-2xl font-bold text-yellow-400 flex items-center gap-1"><BadgePercent size={18} />{profile.totalPoints}</p>
            </div>
            <div className="text-3xl"><Trophy size={32} className="text-yellow-400" /></div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm flex items-center gap-1"><Star size={14} /> Current Level</p>
              <p className="text-2xl font-bold text-blue-400 flex items-center gap-1"><Medal size={18} />{profile.level}</p>
            </div>
            <div className="text-3xl"><Star size={32} className="text-blue-400" /></div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm flex items-center gap-1"><Users size={14} /> Active Batches</p>
              <p className="text-2xl font-bold text-green-400 flex items-center gap-1"><CheckCircle2 size={18} />{enrollments?.filter((e: any) => e.status === "active").length || 0}</p>
            </div>
            <div className="text-3xl"><Users size={32} className="text-green-400" /></div>
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
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bolt size={20} /> Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Browse Sports", icon: <Dumbbell size={20} />, color: "from-green-500 to-emerald-600" },
            { label: "View Schedule", icon: <Calendar size={20} />, color: "from-blue-500 to-cyan-600" },
            { label: "Check Leaderboard", icon: <Trophy size={20} />, color: "from-yellow-500 to-orange-600" },
            { label: "Update Profile", icon: <User2 size={20} />, color: "from-purple-500 to-pink-600" },
          ].map((action, index) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-gradient-to-r ${action.color} p-4 rounded-xl text-white font-semibold text-center flex flex-col items-center`}
            >
              <div className="mb-2">{action.icon}</div>
              <div className="text-sm">{action.label}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
