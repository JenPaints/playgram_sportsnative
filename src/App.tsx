import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { StudentDashboard } from "./components/StudentDashboard";
import { CoachDashboard } from "./components/CoachDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import { Capacitor } from '@capacitor/core';

export default function App() {
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Toaster 
        theme="dark" 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
      <Content />
    </div>
  );
}

function Content() {
  const user = useQuery(api.auth.loggedInUser);
  const needsProfileSetup = useQuery(api.profiles.needsProfileSetup);
  const isNativeApp = Capacitor.isNativePlatform();

  if (user === undefined || needsProfileSetup === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <AuthenticatedApp user={user} needsProfileSetup={needsProfileSetup} isNativeApp={isNativeApp} />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp />
      </Unauthenticated>
    </>
  );
}

function AuthenticatedApp({ user, needsProfileSetup, isNativeApp }: { user: any; needsProfileSetup: boolean; isNativeApp: boolean }) {
  // Show profile setup if needed
  if (needsProfileSetup) {
    return <ProfileSetup />;
  }

  // If no profile found, show loading
  if (!user?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Setting up your profile...</h2>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Check subscription status for students
  if (user.profile.role === "student" && 
      user.profile.subscriptionStatus !== "active") {
    return <SubscriptionRequired user={user} />;
  }

  // Route to appropriate dashboard based on role
  if (isNativeApp && user.profile.role === "admin") {
    return <NotAvailable />;
  }

  switch (user.profile.role) {
    case "student":
      return <StudentDashboard user={user} />;
    case "coach":
      return <CoachDashboard user={user} />;
    case "admin":
      return <AdminDashboard user={user} />;
    default:
      return <StudentDashboard user={user} />;
  }
}

function UnauthenticatedApp() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              PlayGram
            </h1>
            <p className="text-xl text-gray-400">Sports Coaching Platform</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {["⚽", "🏀", "🏸"].map((emoji, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="text-4xl p-4 bg-gray-800 rounded-xl border border-gray-700"
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <SignInForm />
        </motion.div>
      </motion.div>
    </div>
  );
}

function SubscriptionRequired({ user }: { user: any }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Subscription Required</h2>
          <p className="text-gray-400">
            Your subscription has expired. Please renew to continue accessing PlayGram.
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold"
          >
            Renew Subscription
          </motion.button>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Need help?</span>
            <SignOutButton />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function NotAvailable() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Not Available</h2>
          <p className="text-gray-400">
            This feature is not available in the native app.
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold"
          >
            Return to Web
          </motion.button>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Need help?</span>
            <SignOutButton />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
