import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import QrScanner from "qr-scanner";
import QRCode from "react-qr-code";
import { Id } from "../../../convex/_generated/dataModel";
import { LoadingSpinner } from "../ui/LoadingSpinner";

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
  const [selectedBatch, setSelectedBatch] = useState<Id<"batches"> | "">("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  const markAttendance = useMutation(api.attendance.markAttendanceByCoachScan);
  const generateQR = useMutation(api.attendance.generateAttendanceQR);
  const batches = useQuery(api.batches.getCoachBatches);
  const attendance = useQuery(
    api.attendance.getBatchAttendance,
    selectedBatch ? { batchId: selectedBatch as Id<"batches">, date: sessionDate } : "skip"
  );

  // Handle QR scan (student's permanent QR)
  const handleQRScan = async (code: string) => {
    if (!selectedBatch) {
      toast.error("Select a batch first");
      return;
    }
    try {
      const result = await markAttendance({ studentQRCode: code });
      toast.success("Attendance marked!");
      setScannedResult(result);
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

  // Initialize camera on component mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // Check and list video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        const hasVideoDevice = videoInputs.length > 0;
        if (!hasVideoDevice) {
          setCameraError("No camera found on your device");
          return;
        }
        // Request camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
          // Force video to play
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error('Video play error:', err);
              setCameraError('Unable to start video playback.');
            });
          };
        }
        // Initialize QRScanner
        if (!qrScannerRef.current && videoRef.current) {
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => handleQRScan(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment',
              returnDetailedScanResult: true,
            }
          );
        }
      } catch (error) {
        console.error("Error initializing camera:", error);
        setCameraError("Failed to access camera. Please check your permissions.");
      }
    };
    initializeCamera();
    // Cleanup on unmount
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    if (!qrScannerRef.current) {
      setCameraError("QR Scanner not initialized");
      return;
    }
    try {
      setCameraError(null);
      setIsScanning(true);
      await qrScannerRef.current.start();
    } catch (error) {
      console.error("Error starting scanner:", error);
      setCameraError("Failed to start scanning");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (!qrScannerRef.current) {
      return;
    }
    try {
      await qrScannerRef.current.stop();
      setIsScanning(false);
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel for Camera Devices */}
      <div className="bg-gray-900 text-gray-200 rounded-xl p-4 mb-4">
        <div className="font-bold mb-2">Camera Debug Info</div>
        {videoDevices.length === 0 ? (
          <div>No video input devices detected.</div>
        ) : (
          <ul>
            {videoDevices.map(device => (
              <li key={device.deviceId}>
                <span className="font-mono">{device.label || 'Unnamed device'}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 text-xs">
          <div><b>hasCamera:</b> {String(hasCamera)}</div>
          <div><b>cameraError:</b> {cameraError || 'None'}</div>
          <div><b>videoRef.current?.srcObject:</b> {videoRef.current && videoRef.current.srcObject ? 'SET' : 'NOT SET'}</div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Mark Attendance</h2>
        <div className="text-sm text-gray-400">
          Scan student QR codes to mark attendance
        </div>
      </div>

      {/* Batch Selection */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Batch</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value as Id<"batches"> | "")}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            >
              <option value="">Select a batch</option>
              {batches?.map((batch) => (
                <option key={batch._id} value={batch._id}>{batch.name} - {batch.sport?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
        </div>
      </div>

      {/* QR Scanner UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Camera Scanner</h3>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-md h-64 bg-gray-900 rounded-lg overflow-hidden relative">
            {hasCamera ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                  style={{ background: '#222' }}
                />
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-red-400 text-center px-4">{cameraError}</p>
                  </div>
                )}
                {!isScanning && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <button
                      onClick={startScanning}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Scanning
                    </button>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={stopScanning}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Stop Scanning
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-gray-400">No camera available</p>
                  <p className="text-gray-500 text-sm mt-2">Use manual entry below</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Manual Entry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Manual Entry</h3>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Enter QR Code
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              placeholder="Enter QR code manually"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Mark Attendance
          </button>
        </form>
      </motion.div>

      {/* Attendance List */}
      {selectedBatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Today's Attendance</h3>
          {attendance === undefined ? (
            <LoadingSpinner size="md" />
          ) : attendance.length === 0 ? (
            <p className="text-gray-400">No attendance records for today</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">
                      {record.student.profile?.firstName} {record.student.profile?.lastName}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-green-400">Present</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
