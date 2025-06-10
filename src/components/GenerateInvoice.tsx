import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { useAction } from "convex/react";
import { loadRazorpayScript } from "../utils/loadRazorpayScript";

interface GenerateInvoiceProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

interface User {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
}

interface Enrollment {
  _id: Id<"enrollments">;
  sportId: Id<"sports">;
  batchId: Id<"batches">;
  amount: number;
  sport: {
    name: string;
  };
  batch: {
    name: string;
  };
}

export default function GenerateInvoice({ onSuccess, onCancel, onClose }: GenerateInvoiceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"user" | "enrollment" | "payment">("user");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const users = useQuery(api.users.listUsers, {}) as unknown as User[] || [];
  const enrollments = useQuery(api.enrollments.listEnrollments, { userId: selectedUser?._id }) as unknown as Enrollment[] || [];

  const createRazorpayOrder = useAction(api.razorpay.createRazorpayOrder);
  const verifyPayment = useAction(api.razorpay.verifyRazorpayPayment);
  const generateInvoice = useMutation(api.invoices.generateInvoice);
  const updateInvoiceStatus = useMutation(api.invoices.updateInvoiceStatus);

  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setStep("enrollment");
  };

  const handleEnrollmentSelect = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setStep("payment");
  };

  const handleGenerateInvoice = async () => {
    if (!selectedUser || !selectedEnrollment) return;

    try {
      setLoading(true);
      setError("");

      // Create Razorpay order
      const order = await createRazorpayOrder({
        amount: selectedEnrollment.amount * 100, // Convert to paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      // Generate invoice in our system
      const invoiceId = await generateInvoice({
        userId: selectedUser._id,
        enrollmentId: selectedEnrollment._id,
        amount: selectedEnrollment.amount,
        method: "razorpay",
      });

      // Load Razorpay script
      await loadRazorpayScript();
      if (!window.Razorpay) {
        setError("Razorpay SDK not loaded");
        setLoading(false);
        return;
      }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: Number(selectedEnrollment?.amount) * 100,
        currency: "INR",
        name: "PlayGram Sports",
        description: `Payment for ${selectedEnrollment?.sport.name} - ${selectedEnrollment?.batch.name}`,
        order_id: order.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }) => {
          try {
            // Verify payment
            const verification = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.verified) {
              // Update invoice status
              await updateInvoiceStatus({
                id: invoiceId,
                status: "completed",
                transactionId: response.razorpay_payment_id,
              });

              onSuccess?.();
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setError("Payment verification failed");
            await updateInvoiceStatus({
              id: invoiceId,
              status: "failed",
            });
          }
        },
        prefill: {
          name: selectedUser?.firstName + " " + selectedUser?.lastName,
          email: selectedUser?.email,
        },
        theme: {
          color: "#3b82f6",
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Invoice generation error:", err);
      setError("Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "user":
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                  <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-gray-400 text-center py-4">No users found</p>
              )}
            </div>
          </div>
        );

      case "enrollment":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep("user")}
                className="text-gray-400 hover:text-white"
              >
                ← Back
              </button>
              <p className="text-gray-400">
                Select enrollment for {selectedUser?.firstName} {selectedUser?.lastName}
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {enrollments.map((enrollment) => (
                <button
                  key={enrollment._id}
                  onClick={() => handleEnrollmentSelect(enrollment)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                  <p className="text-white font-medium">{enrollment.sport.name}</p>
                  <p className="text-gray-400 text-sm">{enrollment.batch.name}</p>
                  <p className="text-orange-400 font-bold mt-1">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR'
                    }).format(enrollment.amount)}
                  </p>
                </button>
              ))}
              {enrollments.length === 0 && (
                <p className="text-gray-400 text-center py-4">No enrollments found</p>
              )}
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep("enrollment")}
                className="text-gray-400 hover:text-white"
              >
                ← Back
              </button>
              <p className="text-gray-400">Review and generate invoice</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Student</p>
                <p className="text-white">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
                <p className="text-gray-400 text-sm">{selectedUser?.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Enrollment</p>
                <p className="text-white">{selectedEnrollment?.sport.name}</p>
                <p className="text-gray-400 text-sm">{selectedEnrollment?.batch.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-orange-400 font-bold">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(selectedEnrollment?.amount || 0)}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Generate Invoice</h3>
        <button
          onClick={() => {
            onCancel?.();
            onClose?.();
          }}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {renderStep()}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            onCancel?.();
            onClose?.();
          }}
          className="px-4 py-2 text-gray-300 hover:text-white"
          disabled={loading}
        >
          Cancel
        </button>
        {step === "payment" && (
          <button
            onClick={handleGenerateInvoice}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Processing..." : "Generate Invoice"}
          </button>
        )}
      </div>
    </div>
  );
} 