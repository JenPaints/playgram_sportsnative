import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useState, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";
import { CalendarCheck2, CreditCard, Users, Trophy, ChevronDown, ChevronUp, ReceiptText, CheckCircle2, XCircle, Clock } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: {
        color: string;
      };
    }) => {
      open: () => void;
    };
  }
}

interface BatchDetails {
  _id: Id<"batches">;
  name: string;
  sport: {
    name: string;
    description: string;
    pricePerMonth: number;
  };
  coach?: {
    name: string;
  };
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  venue: string;
  level: string;
  ageGroup: string;
  maxStudents: number;
  currentStudents: number;
}

interface Enrollment {
  _id: Id<"enrollments">;
  userId: Id<"users">;
  batchId: Id<"batches">;
  sportId: Id<"sports">;
  status: "active" | "inactive" | "pending" | "completed";
  paymentStatus: "paid" | "unpaid" | "pending";
  enrolledAt: number;
  batch: Doc<"batches"> & { schedule: { days: string[]; startTime: string; endTime: string; }; };
  sport: Doc<"sports">;
  user: Doc<"users">;
  coach?: { name: string; };
  attendancePercent?: number;
}

interface Payment {
  _id: Id<"payments">;
  userId: Id<"users">;
  enrollmentId: Id<"enrollments">;
  amount: number;
  status: "pending" | "completed" | "failed" | "attempted";
  method: string;
  transactionId?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  paymentDate?: number;
  receiptNumber?: string;
  paymentPeriod?: string;
  refunded?: boolean;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: number;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  enrollment: {
    sportId: Id<"sports">;
    batchId: Id<"batches">;
    sport: {
      name: string;
    };
    batch: {
      name: string;
    };
  };
}

// Lazy load the batch image component
const BatchImage = lazy(() => import('../ui/BatchImage'));

export function MyBatches() {
  const enrollments = useQuery(api.sports.getUserEnrollments) as Enrollment[] | undefined;
  const createRazorpayOrder = useAction(api.razorpay.createRazorpayOrder);
  const verifyRazorpayPayment = useAction(api.razorpay.verifyRazorpayPayment);
  const updatePaymentStatus = useMutation(api.sports.updatePaymentStatus);
  const createPayment = useMutation(api.payments.createPayment);
  const setPaymentCompleted = useMutation(api.payments.setPaymentCompleted);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetails | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});

  // Get payment history for each enrollment
  const paymentHistories = useQuery(api.payments.listPayments, {
    userId: undefined, // This will be set for each enrollment
  }) as Payment[] | undefined;

  // Component to display attendance history for a batch
  const BatchAttendanceHistory = ({ userId, batchId }: { userId: Id<"users">; batchId: Id<"batches"> }) => {
    const attendance = useQuery(api.attendance.getStudentAttendance, { studentId: userId, batchId }) as Doc<"attendance">[] | undefined | null;

    if (!attendance) {
      return <LoadingSpinner />;
    }

    if (attendance.length === 0) {
      return <p className="text-sm text-gray-500">No attendance records found for this batch.</p>;
    }

    return (
      <div className="mt-4 space-y-2 text-sm">
        <h4 className="font-semibold">Attendance History:</h4>
        {attendance.map((record) => (
          <div key={record._id} className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
            <span>{new Date(record.date).toLocaleDateString()}</span>
            {record.isPresent ? (
              <span className="text-green-500 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Present</span>
            ) : (
              <span className="text-red-500 flex items-center"><XCircle className="w-4 h-4 mr-1" /> Absent</span>
            )}
            <span className="text-gray-400">Method: {record.method}</span>
            {record.notes && <span className="text-gray-400">Notes: {record.notes}</span>}
          </div>
        ))}
      </div>
    );
  };

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)));

      document.body.appendChild(script);
    });
  };

  // Razorpay handler
  const handlePayNow = async (enrollment: any) => {
    setLoadingPayment(enrollment._id);
    setPaymentError(null);

    try {
      // Create Razorpay order
      const order = await createRazorpayOrder({
        amount: (enrollment.sport?.pricePerMonth || 0) * 100,
        currency: "INR",
        receipt: `receipt_${enrollment._id}`,
      });

      // Load Razorpay script
      await loadRazorpayScript();
      if (!window.Razorpay) {
        setPaymentError("Razorpay SDK not loaded");
        setLoadingPayment(null);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: parseInt(order.amount.toString(), 10),
        currency: order.currency,
        name: "Sports Academy",
        description: `Payment for ${enrollment.sport?.name || ''} - ${enrollment.batch?.name || ''}`,
        order_id: order.id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify payment with Razorpay
            const verification = await verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification.verified) {
              throw new Error("Payment verification failed");
            }

            // Create payment record first
            const paymentId = await createPayment({
              userId: enrollment.userId,
              enrollmentId: enrollment._id,
              amount: enrollment.sport?.pricePerMonth || 0,
              method: "razorpay",
            });

            if (!paymentId) {
              throw new Error("Failed to create payment record");
            }

            // Set payment as completed with verification data
            await setPaymentCompleted({
              paymentId,
              transactionId: response.razorpay_payment_id,
              paymentDate: Date.now(),
              receiptNumber: `REC-${Date.now()}`,
            });

            // Update enrollment payment status
            await updatePaymentStatus({
              enrollmentId: enrollment._id,
              status: "paid",
            });

            toast.success("Payment successful!");
            setLoadingPayment(null);
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentError(error instanceof Error ? error.message : "Payment verification failed. Please contact support.");
            setLoadingPayment(null);
          }
        },
        prefill: {
          name: enrollment.user?.name || '',
          email: enrollment.user?.email || '',
          contact: enrollment.user?.phone || '',
        },
        theme: {
          color: "#2563EB",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error instanceof Error ? error.message : "Failed to load Razorpay. Please try again.");
      setLoadingPayment(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case 'completed':
        return 'bg-green-700 text-green-300';
      case 'pending':
        return 'bg-yellow-700 text-yellow-300';
      case 'failed':
        return 'bg-red-700 text-red-300';
      case 'attempted':
        return 'bg-blue-700 text-blue-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  if (!enrollments) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {enrollments.map((enrollment) => {
        const enrollmentPayments = paymentHistories?.filter(
          (payment) => payment.enrollmentId === enrollment._id
        ) || [];
        const latestPayment = enrollmentPayments.sort((a, b) => b.createdAt - a.createdAt)[0];
        const attendancePercent = enrollment.attendancePercent || 0;
        const batchImage = `/images/sports/${enrollment.sport?.name?.toLowerCase() || 'default'}.jpg`;
        return (
          <motion.div
            key={enrollment._id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="relative bg-gradient-to-br from-indigo-800/80 via-purple-800/70 to-pink-700/70 rounded-3xl p-8 shadow-2xl border border-indigo-500 flex flex-col md:flex-row gap-8 items-center overflow-hidden"
          >
            {/* Sport image with lazy loading */}
            <div className="flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-white/20 bg-gray-900">
                  <Suspense fallback={<div className="w-24 h-24 rounded-xl bg-gray-700 animate-pulse" />}>
                    <BatchImage src={enrollment.sport?.imageUrl || `/images/sports/${enrollment.sport?.name?.toLowerCase() || 'default'}.jpg`} alt={enrollment.sport?.name || "Sport Image"} className="w-24 h-24 rounded-xl shadow-lg" />
                  </Suspense>
            </div>
            {/* Batch info and actions */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
                    <Users className="text-indigo-300" size={24} /> {enrollment.batch?.name}
                  </h3>
                  <div className="text-indigo-200 text-lg font-medium flex items-center gap-2 mb-1">
                    <Trophy className="text-yellow-400" size={18} /> {enrollment.sport?.name}
                  </div>
                  <div className="text-indigo-300 text-sm mb-2">Coach: {enrollment.coach?.name || '-'}</div>
                  <div className="text-indigo-400 text-xs">Schedule: {enrollment.batch?.schedule?.days?.join(', ')} {enrollment.batch?.schedule?.startTime} - {enrollment.batch?.schedule?.endTime}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Payment status and action */}
                  {latestPayment?.status === "completed" ? (
                    <span className="px-4 py-2 rounded-xl bg-green-700/80 text-green-200 font-bold flex items-center gap-2 shadow-md">
                      <CheckCircle2 size={18} /> Paid
                    </span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 16px #34d399" }}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold shadow-lg text-lg hover:from-green-600 hover:to-blue-600 transition flex items-center gap-2"
                      onClick={() => handlePayNow(enrollment)}
                      disabled={loadingPayment === enrollment._id}
                    >
                      <CreditCard size={20} />
                      {loadingPayment === enrollment._id ? "Processing..." : `Pay Now ₹${enrollment.sport?.pricePerMonth || 0}`}
                    </motion.button>
                  )}
                  {paymentError && (
                    <span className="text-red-400 text-sm flex items-center gap-1"><XCircle size={16} /> {paymentError}</span>
                  )}
                </div>
              </div>
              {/* Attendance progress bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck2 className="text-green-400" size={18} />
                  <span className="text-green-200 text-sm">Attendance</span>
                  <span className="ml-auto text-green-100 text-xs font-bold">{attendancePercent}%</span>
                </div>
                <div className="w-full h-3 bg-green-900/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${attendancePercent}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow"
                  />
                </div>
              </div>
              {/* Payment history toggle */}
              <div className="mt-6">
                <button
                  className="flex items-center gap-2 text-indigo-200 hover:text-white font-semibold text-sm focus:outline-none"
                  onClick={() => setShowHistory((prev) => ({ ...prev, [enrollment._id]: !prev[enrollment._id] }))}
                >
                  <ReceiptText size={18} /> Payment History
                  {showHistory[enrollment._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence initial={false}>
                  {showHistory[enrollment._id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 overflow-x-auto"
                    >
                      {enrollmentPayments.length > 0 ? (
                        <table className="min-w-full border text-sm bg-white/10 rounded-xl overflow-hidden">
                          <thead>
                            <tr className="bg-indigo-900/80 text-indigo-100">
                              <th className="border px-2 py-1">Date</th>
                              <th className="border px-2 py-1">Amount</th>
                              <th className="border px-2 py-1">Status</th>
                              <th className="border px-2 py-1">Method</th>
                              <th className="border px-2 py-1">Receipt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrollmentPayments.map((payment) => (
                              <tr key={payment._id} className="hover:bg-indigo-900/40 transition">
                                <td className="border px-2 py-1 text-indigo-100">{formatDate(payment.createdAt)}</td>
                                <td className="border px-2 py-1 text-pink-200 font-bold">{formatAmount(payment.amount)}</td>
                                <td className={`border px-2 py-1 font-bold ${getStatusColor(payment.status)}`}>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
                                <td className="border px-2 py-1 text-indigo-100">{payment.method}</td>
                                <td className="border px-2 py-1 text-indigo-100">{payment.receiptNumber || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-indigo-200 py-4">No payment history found.</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Attendance history timeline */}
              {expandedBatch === enrollment.batchId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8"
                >
                  <BatchAttendanceHistory userId={enrollment.userId} batchId={enrollment.batchId} />
                </motion.div>
              )}
            </div>
            {/* Animated background shapes */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" />
          </motion.div>
        );
      })}
    </div>
  );
}

export default MyBatches;

function BatchAttendanceHistory({ batchId, studentId }: { batchId: Id<"batches">; studentId: Id<"users"> }) {
  const attendance: Doc<"attendance">[] | undefined | null = useQuery(api.attendance.getStudentAttendance, { batchId, studentId });
  if (attendance === undefined) {
    return <div className="py-4"><LoadingSpinner size="md" /></div>;
  }
  if (attendance.length === 0) {
    return <div className="py-4 text-gray-400">No attendance records found for this batch.</div>;
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Present</th>
            <th className="border px-2 py-1">Method</th>
            <th className="border px-2 py-1">Notes</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((record) => (
            <tr key={record._id}>
              <td className="border px-2 py-1">{record.date}</td>
              <td className="border px-2 py-1">{record.isPresent ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{record.method}</td>
              <td className="border px-2 py-1">{record.notes || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
