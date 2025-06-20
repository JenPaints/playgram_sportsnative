import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { SignOutButton } from "../SignOutButton";
import LoadingSpinner from "./ui/LoadingSpinner";
import { SportsGrid } from "./student/SportsGrid";
import HomeTab from "./student/HomeTab";
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
  BadgePercent,
  Medal,
  CalendarCheck2,
  Menu,
  X
} from "lucide-react";
import gsap from 'gsap';
import { animate } from 'animejs';
import Hyperspeed from "./backgrounds/Hyperspeed";
import "./backgrounds/Hyperspeed.css";
import { Avatar } from "./ui/Avatar";
import { AttendanceTab } from "./student/AttendanceTab";

interface StudentDashboardProps {
  user: any;
}

const tabs = [
  { id: "home", label: "Home", icon: <Home size={20} /> },
  { id: "sports", label: "Sports", icon: <Dumbbell size={20} /> },
  { id: "batches", label: "My Batches", icon: <Users size={20} /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={20} /> },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck2 size={20} /> },
  { id: "merchandise", label: "Merchandise", icon: <ShoppingCart size={20} /> },
  { id: "profile", label: "Profile", icon: <User size={20} /> },
];

// Lazy load components with error handling
const MyBatchesComponent = lazy(() => import('./student/MyBatches').catch(err => {
  console.error('Error loading MyBatches:', err);
  return { default: () => <div className="text-white">Error loading MyBatches</div> };
}));

const LeaderboardComponent = lazy(() => import('./student/Leaderboard').catch(err => {
  console.error('Error loading Leaderboard:', err);
  return { default: () => <div className="text-white">Error loading Leaderboard</div> };
}));

const ProfileComponent = lazy(() => import('./student/Profile').catch(err => {
  console.error('Error loading Profile:', err);
  return { default: () => <div className="text-white">Error loading Profile</div> };
}));

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
  const [error, setError] = useState<string | null>(null);
  const profile = useQuery(api.users.getCurrentProfile);
  const enrollments = useQuery(api.sports.getUserEnrollments);
  const attendanceData = useQuery(api.attendance.listAllAttendance);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('Profile:', profile);
    console.log('Enrollments:', enrollments);
    console.log('Attendance Data:', attendanceData);
  }, [profile, enrollments, attendanceData]);

  useGsapEntrance(containerRef);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && !(event.target as Element).closest('.sidebar') && !(event.target as Element).closest('.menu-button')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Sidebar animation logic
  useEffect(() => {
    if (activeTabRef.current) {
      gsap.to(activeTabRef.current, {
        boxShadow: '0 0 24px 4px #6366f1',
        scale: 1.12,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, [activeTab]);

  // Optimize sidebar animation
  useEffect(() => {
    if (!sidebarRef.current) return;
    
    const icons = sidebarRef.current.querySelectorAll('.sidebar-icon');
    const animationPromises: Promise<void>[] = [];

    icons.forEach((icon) => {
      const enterAnimation = () => {
        return new Promise<void>((resolve) => {
          animate(icon, {
            scale: 1.2,
            rotate: '1turn',
            duration: 600,
            easing: 'easeOutElastic(1, .8)',
            onComplete: () => resolve()
          });
        });
      };

      const leaveAnimation = () => {
        return new Promise<void>((resolve) => {
          animate(icon, {
            scale: 1,
            rotate: '0turn',
            duration: 400,
            easing: 'easeOutExpo',
            onComplete: () => resolve()
          });
        });
      };

      icon.addEventListener('mouseenter', () => {
        animationPromises.push(enterAnimation());
      });
      
      icon.addEventListener('mouseleave', () => {
        animationPromises.push(leaveAnimation());
      });
    });

    return () => {
      icons.forEach((icon) => {
        icon.removeEventListener('mouseenter', () => {});
        icon.removeEventListener('mouseleave', () => {});
      });
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#6366f1]">
        <div className="bg-red-500/10 backdrop-blur-lg p-8 rounded-xl border border-red-500/20 text-white">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#6366f1]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Avatar seed for profile
  const avatarSeed = profile.profile?.firstName
    ? `${profile.profile.firstName} ${profile.profile.lastName || ""}`.trim()
    : undefined;
  const avatarUrl = avatarSeed
    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`
    : undefined;

  const renderContent = () => {
    try {
      switch (activeTab) {
        case "home":
          return <HomeTab 
            profile={profile.profile} 
            enrollments={enrollments} 
            attendanceData={attendanceData} 
            onNavigate={(tab) => setActiveTab(tab)}
          />;
        case "sports":
          return <SportsGrid />;
        case "batches":
          return (
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <MyBatchesComponent />
            </Suspense>
          );
        case "leaderboard":
          return (
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <LeaderboardComponent />
            </Suspense>
          );
        case "attendance":
          return <AttendanceTab user={user} />;
        case "merchandise":
          return <MerchandiseTab />;
        case "profile":
          return (
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <ProfileComponent />
            </Suspense>
          );
        default:
          return <HomeTab 
            profile={profile.profile} 
            enrollments={enrollments} 
            attendanceData={attendanceData} 
            onNavigate={(tab) => setActiveTab(tab)}
          />;
      }
    } catch (err) {
      console.error('Error rendering content:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while rendering the content');
      return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#6366f1] min-h-screen">
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 w-full h-full z-0 opacity-60 pointer-events-none">
          <Hyperspeed />
        </div>
        <div ref={containerRef} className="relative z-10">
          {/* Header */}
          <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-[#18181b]/90 via-[#312e81]/90 to-[#6366f1]/80 backdrop-blur-md border-b border-indigo-900/60 sticky top-0 z-50 shadow-xl"
          >
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
              <div className="flex flex-row justify-between items-center h-20 gap-4">
                {/* Left: Logo and Title */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Hamburger for mobile */}
                  <button
                    className="menu-button sm:hidden mr-2 p-2 rounded hover:bg-indigo-900/60 focus:outline-none"
                    onClick={() => setSidebarOpen((v) => !v)}
                    aria-label="Open sidebar"
                  >
                    <Menu size={28} className="text-white" />
                  </button>
                  <img src="https://jenpaints.art/wp-content/uploads/2025/06/logo-playgram.png" alt="PlayGram Logo" className="w-10 h-10 rounded-full shadow-lg border-2 border-indigo-400 bg-white/10 object-contain" />
                  <span className="text-3xl font-extrabold text-white tracking-tight ml-2 whitespace-nowrap drop-shadow-lg">PlayGram</span>
                </div>
                {/* Center: Welcome */}
                <div className="hidden md:block flex-1 text-center">
                  <span className="text-lg text-indigo-200 font-medium">Welcome back, </span>
                  <span className="text-xl font-bold text-white drop-shadow">{profile.profile?.firstName} {profile.profile?.lastName}</span>
                </div>
                {/* Right: User Info and Actions */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-900/60 text-yellow-300 font-semibold flex items-center gap-1 shadow"><Award size={16} /> Points</span>
                      <span className="px-3 py-1 rounded-full bg-indigo-900/60 text-yellow-200 font-bold flex items-center gap-1 shadow"><BadgePercent size={18} /> {profile.profile?.totalPoints}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-900/60 text-blue-300 font-semibold flex items-center gap-1 shadow"><Star size={16} /> Level</span>
                      <span className="px-3 py-1 rounded-full bg-indigo-900/60 text-blue-200 font-bold flex items-center gap-1 shadow"><Medal size={18} />{profile.profile?.level}</span>
                    </div>
                  </div>
                  <Avatar src={avatarUrl} alt="Profile" size={44} className="border-2 border-indigo-400 shadow" />
                  <SignOutButton />
                </div>
              </div>
            </div>
          </motion.header>

          <div className="flex">
            {/* Sidebar Navigation */}
            {/* Desktop Sidebar */}
            <nav ref={sidebarRef} className="sidebar hidden md:flex w-72 bg-gradient-to-b from-black/70 via-indigo-950/80 to-indigo-900/80 border-r-2 border-indigo-800 shadow-2xl min-h-screen p-6 flex-col glassmorphism">
              <div className="space-y-3">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.04, x: 6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    ref={tab.id === activeTab ? activeTabRef : undefined}
                    className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 sidebar-icon text-lg font-semibold shadow-md ${
                      tab.id === activeTab
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl border border-indigo-400"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    <span className="text-2xl">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>
              {/* QR Code Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-10 p-5 bg-indigo-900/80 rounded-2xl border border-indigo-700 shadow-lg"
              >
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><QrCode size={20} /> Your QR Code</h3>
                <QRCodeDisplay sessionId={profile.profile?.sessionId} />
              </motion.div>
            </nav>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
            {sidebarOpen && (
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 20 }}
                  className="sidebar fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-black/90 via-indigo-950/95 to-indigo-900/95 border-r-2 border-indigo-800 shadow-2xl p-6 flex-col glassmorphism md:hidden"
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white font-bold text-2xl">Menu</span>
                    <button 
                      onClick={() => setSidebarOpen(false)} 
                      className="p-2 rounded hover:bg-indigo-800/60 focus:outline-none text-white text-xl"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tabs.map((tab) => (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.04, x: 6 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 text-lg font-semibold shadow-md ${
                          tab.id === activeTab
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl border border-indigo-400"
                            : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                        }`}
                      >
                        <span className="text-2xl">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  {/* QR Code Section for Mobile */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-10 p-5 bg-indigo-900/80 rounded-2xl border border-indigo-700 shadow-lg"
                  >
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><QrCode size={20} /> Your QR Code</h3>
                    <QRCodeDisplay sessionId={profile.profile?.sessionId} />
                  </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-7xl mx-auto"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
