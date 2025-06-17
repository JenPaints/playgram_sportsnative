import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "../../../convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

interface PaymentStats {
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  attemptedPayments: number;
  revenueByMethod: Record<string, number>;
  revenueBySport: Record<string, number>;
  revenueByBatch: Record<string, number>;
  totalRefunds: number;
  refundAmount: number;
  averagePaymentAmount: number;
  paymentSuccessRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type FilterStatus = "all" | "pending" | "completed" | "failed" | "attempted";
type PaymentStatus = "pending" | "completed" | "failed" | "attempted";

interface PaymentWithDetails extends Payment {
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

interface PaymentQueryParams {
  status?: PaymentStatus;
  startDate?: number;
  endDate?: number;
}

export function PaymentManagement() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChart, setSelectedChart] = useState<"method" | "sport" | "batch">("method");

  const queryParams = {
    status: filterStatus === "all" ? undefined : filterStatus as PaymentStatus,
    startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
    endDate: dateRange.end ? new Date(dateRange.end).getTime() : undefined,
  } as const;

  const payments = useQuery(api.payments.listPayments, queryParams) as PaymentWithDetails[] | undefined;
  const stats = useQuery(api.payments.getPaymentStats);

  const updatePayment = useMutation(api.payments.updatePayment);
  const processRefund = useMutation(api.payments.processRefund);

  const totalRevenue = stats?.totalRevenue ?? 0;
  const completedPayments = stats?.completedPayments ?? 0;
  const pendingPayments = stats?.pendingPayments ?? 0;
  const failedPayments = stats?.failedPayments ?? 0;
  const revenueByMethod = stats?.revenueByMethod ?? {};
  const revenueBySport = stats?.revenueBySport ?? {};
  const revenueByBatch = stats?.revenueByBatch ?? {};

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((payment) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        payment.user.name.toLowerCase().includes(searchLower) ||
        payment.user.email.toLowerCase().includes(searchLower) ||
        payment.enrollment.sport.name.toLowerCase().includes(searchLower) ||
        payment.enrollment.batch.name.toLowerCase().includes(searchLower) ||
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment.method.toLowerCase().includes(searchLower)
      );
    });
  }, [payments, searchQuery]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getChartData = () => {
    const data = selectedChart === "method" ? revenueByMethod :
                selectedChart === "sport" ? revenueBySport :
                revenueByBatch;

    return Object.entries(data).map(([name, value]) => ({
      name,
      value
    }));
  };

  const handleFilterStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value as FilterStatus;
    setFilterStatus(value);
  };

  if (!payments || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleUpdatePayment = async (paymentId: Id<"payments">, updates: Partial<Payment>) => {
    try {
      await updatePayment({ paymentId, ...updates });
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleProcessRefund = async (paymentId: Id<"payments">, refundAmount: number, refundReason: string) => {
    try {
      await processRefund({ paymentId, refundAmount, refundReason });
      setShowRefundModal(false);
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Payment Management</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-500">₹{totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{completedPayments} successful payments</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Payment Status</h3>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Completed</span>
              <span className="text-green-400">{completedPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending</span>
              <span className="text-yellow-400">{pendingPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Failed</span>
              <span className="text-red-400">{failedPayments}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Revenue by Method</h3>
          <div className="space-y-1 mt-2">
            {Object.entries(revenueByMethod).map(([method, amount]) => (
              <div key={method} className="flex justify-between">
                <span className="text-gray-400">{method}</span>
                <span className="text-green-400">₹{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Revenue by Sport</h3>
          <div className="space-y-1 mt-2">
            {Object.entries(revenueBySport).map(([sport, amount]) => (
              <div key={sport} className="flex justify-between">
                <span className="text-gray-400">{sport}</span>
                <span className="text-green-400">₹{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Distribution Chart */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Revenue Distribution</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedChart("method")}
              className={`px-3 py-1 rounded ${selectedChart === "method" ? "bg-blue-600" : "bg-gray-700"}`}
            >
              By Method
            </button>
            <button
              onClick={() => setSelectedChart("sport")}
              className={`px-3 py-1 rounded ${selectedChart === "sport" ? "bg-blue-600" : "bg-gray-700"}`}
            >
              By Sport
            </button>
            <button
              onClick={() => setSelectedChart("batch")}
              className={`px-3 py-1 rounded ${selectedChart === "batch" ? "bg-blue-600" : "bg-gray-700"}`}
            >
              By Batch
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getChartData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${formatAmount(value)}`}
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatAmount(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-800 p-4 rounded-lg">
        <select
          value={filterStatus}
          onChange={(e) => {
            const value = e.target.value as FilterStatus;
            setFilterStatus(value);
          }}
          className="bg-gray-700 text-white rounded px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="attempted">Attempted</option>
        </select>

        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="bg-gray-700 text-white rounded px-3 py-2"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="bg-gray-700 text-white rounded px-3 py-2"
        />

        <input
          type="text"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-700 text-white rounded px-3 py-2 flex-1"
        />
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-900 rounded-xl">
          <thead>
            <tr className="text-gray-400">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Sport/Batch</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Transaction ID</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                <td className="p-3 text-gray-300">{formatDate(payment.createdAt)}</td>
                <td className="p-3">
                  <div className="text-gray-300">
                    <div className="font-medium">{payment.user.name}</div>
                    <div className="text-sm text-gray-400">{payment.user.email}</div>
                    {payment.user.phone && (
                      <div className="text-sm text-gray-400">{payment.user.phone}</div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-gray-300">
                    <div>{payment.enrollment.sport.name}</div>
                    <div className="text-sm text-gray-400">{payment.enrollment.batch.name}</div>
                  </div>
                </td>
                <td className="p-3 text-orange-400 font-bold">{formatAmount(payment.amount)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(payment.status)}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                  {payment.refunded && (
                    <div className="text-xs text-red-400 mt-1">Refunded</div>
                  )}
                </td>
                <td className="p-3 text-gray-300">{payment.method}</td>
                <td className="p-3 text-gray-300 font-mono text-sm">{payment.transactionId || '-'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowUpdateModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Update
                    </button>
                    {payment.status === "completed" && !payment.refunded && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRefundModal(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-8">No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Update Payment Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">Update Payment</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Status</label>
                  <select
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                    value={selectedPayment.status}
                    onChange={(e) => {
                      const value = e.target.value as PaymentStatus;
                      handleUpdatePayment(selectedPayment._id, { status: value });
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="attempted">Attempted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Notes</label>
                  <textarea
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                    value={selectedPayment.notes || ''}
                    onChange={(e) => handleUpdatePayment(selectedPayment._id, { notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Receipt Number</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                    value={selectedPayment.receiptNumber || ''}
                    onChange={(e) => handleUpdatePayment(selectedPayment._id, { receiptNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Payment Period</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                    value={selectedPayment.paymentPeriod || ''}
                    onChange={(e) => handleUpdatePayment(selectedPayment._id, { paymentPeriod: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">Process Refund</h3>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Original Amount</label>
                  <p className="text-white font-bold">{formatAmount(selectedPayment.amount)}</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Refund Amount</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                    value={selectedPayment.amount}
                    onChange={(e) => handleProcessRefund(selectedPayment._id, Number(e.target.value), '')}
                    max={selectedPayment.amount}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Refund Reason</label>
                  <textarea
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                    rows={3}
                    onChange={(e) => handleProcessRefund(selectedPayment._id, selectedPayment.amount, e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessRefund(selectedPayment._id, selectedPayment.amount, '')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Process Refund
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 