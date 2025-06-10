import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";

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

export function MyBatches() {
  const enrollments = useQuery(api.sports.getUserEnrollments);
  const createRazorpayOrder = useAction(api.razorpay.createRazorpayOrder);
  const verifyRazorpayPayment = useAction(api.razorpay.verifyRazorpayPayment);
  const updatePaymentStatus = useMutation(api.sports.updatePaymentStatus);
  const createPayment = useMutation(api.payments.createPayment);
  const setPaymentCompleted = useMutation(api.payments.setPaymentCompleted);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetails | null>(null);

  // Get payment history for each enrollment
  const paymentHistories = useQuery(api.payments.listPayments, {
    userId: undefined, // This will be set for each enrollment
  }) as Payment[] | undefined;

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
    <div className="space-y-6">
      {enrollments.map((enrollment) => {
        const enrollmentPayments = paymentHistories?.filter(
          (payment) => payment.enrollmentId === enrollment._id
        ) || [];

        return (
          <div key={enrollment._id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6 w-full gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">{enrollment.sport?.name || 'Unknown Sport'}</h3>
                <p className="text-gray-400">{enrollment.batch?.name || 'Unknown Batch'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-400">{formatAmount(enrollment.sport?.pricePerMonth || 0)}</p>
                <p className="text-sm text-gray-400">per month</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Payment History</h4>
              {enrollmentPayments.length === 0 ? (
                <p className="text-gray-400">No payment history available.</p>
              ) : (
                <div className="space-y-4">
                  {enrollmentPayments.map((payment) => (
                    <div key={payment._id} className="bg-gray-700 rounded-lg p-4 w-full">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <p className="text-white font-medium">{formatDate(payment.createdAt)}</p>
                          <p className="text-gray-400 text-sm">
                            {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-400 font-bold">{formatAmount(payment.amount)}</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      {payment.transactionId && (
                        <p className="text-gray-400 text-sm mt-2">
                          Transaction ID: {payment.transactionId}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {enrollment.paymentStatus !== "paid" && (
              <div className="mt-6">
                <button
                  onClick={() => handlePayNow(enrollment)}
                  disabled={loadingPayment === enrollment._id}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPayment === enrollment._id ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </div>
                  ) : (
                    "Pay Now"
                  )}
                </button>
                {paymentError && (
                  <p className="text-red-400 text-sm mt-2">{paymentError}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
