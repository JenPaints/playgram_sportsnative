import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import QrScanner from "qr-scanner";

interface AttendanceResult {
  success: boolean;
  student: {
    name: string;
    userId: string;
    points?: number;
  };
  batch: {
    name: string;
    sport: string | undefined;
  };
}

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<AttendanceResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  
  const markAttendanceByCoachScan = useMutation(api.attendance.markAttendanceByCoachScan);

  const handleQRScan = async (code: string) => {
    try {
      const result = await markAttendanceByCoachScan({ studentQRCode: code });
      setScannedResult(result);
      toast.success(`Attendance marked for ${result.student.name}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to mark attendance");
      setScannedResult(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    await handleQRScan(manualCode.trim());
    setManualCode("");
  };

  const clearResult = () => {
    setScannedResult(null);
  };

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);
        
        if (!hasCamera) {
          setCameraError("No camera found");
          return;
        }

        if (videoRef.current) {
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => handleQRScan(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment',
            }
          );
        }
      } catch (error) {
        setCameraError("Camera initialization failed");
      }
    };

    initCamera();
    return () => qrScannerRef.current?.destroy();
  }, []);

  const startScanning = async () => {
    if (!qrScannerRef.current) return;
    try {
      setIsScanning(true);
      setCameraError(null);
      await qrScannerRef.current.start();
    } catch (error) {
      setCameraError("Camera access denied");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    qrScannerRef.current?.stop();
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">QR Code Scanner</h2>
        <div className="text-sm text-gray-400">
          Scan student QR codes to mark attendance
        </div>
      </div>

      {/* Success Result Display */}
      {scannedResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-2">✅ Attendance Marked Successfully!</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Student:</span>
                  <span>{scannedResult.student.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Batch:</span>
                  <span>{scannedResult.batch.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Sport:</span>
                  <span>{scannedResult.batch.sport}</span>
                </div>
                {scannedResult.student.points && (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Points Awarded:</span>
                    <span className="bg-yellow-500 px-2 py-1 rounded-full text-sm font-bold">+10 Points</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={clearResult}
              className="text-green-100 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Camera Scanner Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Camera Scanner</h3>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-md h-64 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-400">Camera scanning will be available soon</p>
              <p className="text-gray-500 text-sm mt-2">Use manual entry below for now</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Manual Entry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Manual Entry</h3>
        <p className="text-gray-400 text-sm mb-4">
          Enter the student's QR code manually (format: studentId_sessionId)
        </p>
        
        <form onSubmit={handleManualSubmit} className="flex space-x-4">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter student QR code here..."
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!manualCode.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </motion.button>
        </form>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 font-bold">1.</span>
            <p>Get the student's QR code from their profile</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 font-bold">2.</span>
            <p>Enter the QR code in the manual entry field above</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 font-bold">3.</span>
            <p>The system will automatically mark attendance and display student details</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 font-bold">4.</span>
            <p>Students earn 10 points for each attendance marked</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 font-bold">5.</span>
            <p>QR code format: studentUserId_sessionId (e.g., "abc123_xyz789")</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
