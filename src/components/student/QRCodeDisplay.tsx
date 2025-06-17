import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";

interface QRCodeDisplayProps {
  sessionId?: string;
}

// Utility function to truncate long IDs
function truncateId(id: string, front = 6, back = 6) {
  if (!id) return "";
  if (id.length <= front + back) return id;
  return `${id.slice(0, front)}...${id.slice(-back)}`;
}

export function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const profile = useQuery(api.users.getCurrentProfile);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!profile?.profile) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <div className="animate-pulse w-32 h-32 bg-gray-700 rounded-xl mb-2" />
        <div className="h-4 w-24 bg-gray-700 rounded mb-1 animate-pulse" />
        <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const qrValue = `${profile.profile.userId}_${sessionId || profile.profile.sessionId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center space-y-3"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4 rounded-2xl shadow-lg border border-gray-700"
      >
        <QRCode
          value={qrValue}
          size={140}
          bgColor="#18181b"
          fgColor="#fff"
          style={{ borderRadius: 12, background: "#18181b" }}
          level="H"
        />
      </motion.div>
      <div className="text-center">
        <div className="text-white font-semibold text-lg">
          {profile.profile.firstName} {profile.profile.lastName}
        </div>
        <div className="text-gray-400 text-sm font-mono bg-gray-800 rounded px-2 py-1 inline-block mt-1" title={profile.profile.userId}>
          Student ID: {truncateId(profile.profile.userId)}
        </div>
        <div className="text-gray-400 text-sm font-mono bg-gray-800 rounded px-2 py-1 inline-block mt-1" title={sessionId || profile.profile.sessionId}>
          Session: {truncateId(sessionId || profile.profile.sessionId)}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          navigator.clipboard.writeText(qrValue);
          setCopied(true);
        }}
        className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow hover:shadow-xl transition-all"
      >
        {copied ? "Copied!" : "Copy QR Code Value"}
      </motion.button>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-green-400 text-xs mt-1"
          >
            QR code value copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-xs text-gray-500 mt-2">
        Show this QR code to your coach for attendance. <br />
        Keep it safe and do not share with others.
      </div>
    </motion.div>
  );
}
