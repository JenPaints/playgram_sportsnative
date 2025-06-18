import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { StudentDashboard } from "./components/StudentDashboard";
import { CoachDashboard } from "./components/CoachDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import { Capacitor } from '@capacitor/core';

export default function App() {
  const isNativeApp = Capacitor.isNativePlatform();

  // TEST: Literal Tailwind class
  return (
    <>
      <div className="bg-red-500 text-white p-8 text-2xl font-bold text-center">TEST TAILWIND</div>
      <button className="bg-blue-500 text-white rounded-lg px-6 py-3 m-8 text-xl font-bold shadow-lg hover:bg-blue-600">
        Literal Tailwind Button
      </button>
      <div className="admin-dashboard min-h-screen">
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
    </>
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
      return <AdminDashboard />;
    default:
      return <StudentDashboard user={user} />;
  }
}

function UnauthenticatedApp() {
  // Lottie animation embed URLs
  const lottieEmbeds = [
    "https://lottie.host/embed/400155fa-5230-482c-ad1d-7f84ef7d8363/qLW6YUnmQs.lottie",
    "https://lottie.host/embed/6b2db1f6-bf0c-4445-8d0f-e43fe7bedde7/iriHHFOxmc.lottie",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#6366f1] overflow-hidden">
      {/* Header: Logo, Title, Subtitle */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center pt-8 pb-0">
        <img src="https://jenpaints.art/wp-content/uploads/2025/06/logo-playgram.png" alt="PlayGram Logo" className="w-16 h-16 rounded-full shadow-lg border-4 border-indigo-400 bg-white/10 object-contain mb-2 animate-fade-in" />
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1 drop-shadow-lg text-center">PlayGram</h1>
        <p className="text-base text-indigo-200 font-light drop-shadow text-center mb-2">Sports Coaching Platform</p>
      </div>
      {/* Main Content: Lottie + Sign In Box */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center relative mt-2">
        {/* Three Lottie animations in a grid above the sign-in box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-row justify-center items-center gap-6 mb-8 w-full"
        >
          {lottieEmbeds.map((url, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="p-2 bg-indigo-900/80 rounded-xl border border-indigo-700 shadow-lg backdrop-blur-md flex items-center justify-center"
            >
              <iframe
                src={url}
                style={{ width: 64, height: 64, background: 'transparent', border: 'none' }}
                allowFullScreen
                title={`Lottie animation ${index + 1}`}
              />
            </motion.div>
          ))}
        </motion.div>
        {/* Sign In Box */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, type: 'spring' }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-indigo-400 relative z-10 w-full"
        >
          <SignInForm />
        </motion.div>
      </div>
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
