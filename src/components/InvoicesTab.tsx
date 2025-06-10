import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import GenerateInvoice from "./GenerateInvoice";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import React from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface Invoice {
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

export default function InvoicesTab() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGenerateInvoice, setShowGenerateInvoice] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: Id<"users">; name: string } | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<{ id: Id<"enrollments">; amount: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "failed" | "attempted">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Id<"users">[]>([]);
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);

  const payments = useQuery(api.payments.listPayments, {
    status: filterStatus === "all" ? undefined : filterStatus,
    startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
    endDate: dateRange.end ? new Date(dateRange.end).getTime() : undefined,
  }) as Invoice[] || [];

  const usersQuery = useQuery(api.users.listUsers);
  const enrollmentsQuery = useQuery(api.enrollments.listEnrollments);

  const users = usersQuery?.map((user: { _id: Id<"users">; name?: string; email?: string }) => ({
    _id: user._id,
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
  })) || [];

  const enrollments = enrollmentsQuery || [];

  const filteredPayments = payments.filter(payment => {
    const searchStr = `${payment.user.name} ${payment.user.email} ${payment.enrollment.sport.name} ${payment.enrollment.batch.name} ${payment.transactionId || ''}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

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

  const getStatusColor = (status: string) => {
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

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      setLoading(true);
      setError("");
      const { url } = await generatePDF({ invoiceId: invoice._id });
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      setLoading(true);
      setError("");
      // Here you would typically send the invoice via email
      alert('Invoice sending functionality will be implemented here');
    } catch (err) {
      console.error('Error sending invoice:', err);
      setError('Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      setLoading(true);
      setError("");
      await markAsPaid({
        id: invoice._id,
        method: "cash",
        notes: "Marked as paid by admin",
      });
      setModalOpen(false);
    } catch (err) {
      console.error('Error marking as paid:', err);
      setError('Failed to mark as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulkInvoices = async (enrollmentId: Id<"enrollments">, amount: number) => {
    try {
      setLoading(true);
      setError("");
      await generateBulkInvoices({
        enrollmentId,
        amount,
        userIds: selectedStudents,
      });
      setShowBulkInvoiceModal(false);
      setSelectedStudents([]);
    } catch (err) {
      console.error('Error generating bulk invoices:', err);
      setError('Failed to generate bulk invoices');
    } finally {
      setLoading(false);
    }
  };

  if (!payments) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">📄 Invoices</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkInvoiceModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Generate Bulk Invoices
          </button>
          <button
            onClick={() => setShowGenerateInvoice(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Generate Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-800 p-4 rounded-lg">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
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
          placeholder="Search by student name, email, sport, batch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-700 text-white rounded px-3 py-2 flex-1"
        />
      </div>

      <div className="overflow-x-auto">
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Sport/Batch</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <TableCell className="p-3 text-gray-300">{formatDate(payment.createdAt)}</TableCell>
                  <TableCell className="p-3">
                    <div className="text-gray-300">
                      <div className="font-medium">{payment.user.name}</div>
                      <div className="text-sm text-gray-400">{payment.user.email}</div>
                      {payment.user.phone && (
                        <div className="text-sm text-gray-400">{payment.user.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="text-gray-300">
                      <div>{payment.enrollment.sport.name}</div>
                      <div className="text-sm text-gray-400">{payment.enrollment.batch.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="p-3 text-orange-400 font-bold">{formatAmount(payment.amount)}</TableCell>
                  <TableCell className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                    {payment.refunded && (
                      <div className="text-xs text-red-400 mt-1">Refunded</div>
                    )}
                  </TableCell>
                  <TableCell className="p-3 text-gray-300">{payment.method}</TableCell>
                  <TableCell className="p-3 text-gray-300 font-mono text-sm">{payment.transactionId || '-'}</TableCell>
                  <TableCell className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewInvoice(payment)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(payment)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        disabled={loading}
                      >
                        {loading ? 'Downloading...' : 'Download'}
                      </button>
                      <button
                        onClick={() => handleSendInvoice(payment)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                        disabled={loading}
                      >
                        Send
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">No invoices found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {modalOpen && selectedInvoice && (
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
                <h3 className="text-xl font-bold text-white">Invoice Details</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-400 text-sm">Student Information</h4>
                    <p className="text-white font-medium">{selectedInvoice.user.name}</p>
                    <p className="text-gray-300">{selectedInvoice.user.email}</p>
                    {selectedInvoice.user.phone && (
                      <p className="text-gray-300">{selectedInvoice.user.phone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-sm">Enrollment Details</h4>
                    <p className="text-white">{selectedInvoice.enrollment.sport.name}</p>
                    <p className="text-gray-300">{selectedInvoice.enrollment.batch.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-400 text-sm">Payment Information</h4>
                    <p className="text-white">Amount: {formatAmount(selectedInvoice.amount)}</p>
                    <p className="text-gray-300">Method: {selectedInvoice.method}</p>
                    <p className="text-gray-300">Status: {selectedInvoice.status}</p>
                    {selectedInvoice.transactionId && (
                      <p className="text-gray-300">Transaction ID: {selectedInvoice.transactionId}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-sm">Dates</h4>
                    <p className="text-gray-300">Created: {formatDate(selectedInvoice.createdAt)}</p>
                    {selectedInvoice.paymentDate && (
                      <p className="text-gray-300">Paid: {formatDate(selectedInvoice.paymentDate)}</p>
                    )}
                    {selectedInvoice.refundDate && (
                      <p className="text-gray-300">Refunded: {formatDate(selectedInvoice.refundDate)}</p>
                    )}
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <h4 className="text-gray-400 text-sm">Notes</h4>
                    <p className="text-gray-300">{selectedInvoice.notes}</p>
                  </div>
                )}

                {selectedInvoice.refunded && (
                  <div className="bg-red-900/30 p-4 rounded-lg">
                    <h4 className="text-red-400 text-sm font-medium">Refund Information</h4>
                    <p className="text-red-300">Amount: {formatAmount(selectedInvoice.refundAmount || 0)}</p>
                    <p className="text-red-300">Reason: {selectedInvoice.refundReason}</p>
                    <p className="text-red-300">Date: {formatDate(selectedInvoice.refundDate || 0)}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {selectedInvoice.status === "pending" && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedInvoice)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    disabled={loading}
                  >
                    Mark as Paid (Cash)
                  </button>
                )}
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  disabled={loading}
                >
                  {loading ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => handleSendInvoice(selectedInvoice)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                  disabled={loading}
                >
                  Send Invoice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Invoice Modal */}
      <AnimatePresence>
        {showGenerateInvoice && (
          <GenerateInvoice
            onClose={() => setShowGenerateInvoice(false)}
            onSuccess={() => {
              setShowGenerateInvoice(false);
              // Refresh the payments list
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Invoice Generation Modal */}
      <AnimatePresence>
        {showBulkInvoiceModal && (
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
                <h3 className="text-xl font-bold text-white">Generate Bulk Invoices</h3>
                <button
                  onClick={() => setShowBulkInvoiceModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select Students</label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {users.map((user: User) => (
                      <label key={user._id} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, user._id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== user._id));
                            }
                          }}
                          className="form-checkbox h-4 w-4 text-indigo-600"
                        />
                        <span className="text-white">{user.firstName} {user.lastName}</span>
                        <span className="text-gray-400 text-sm">({user.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select Enrollment</label>
                  <select
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
                    onChange={(e) => {
                      const [id, amount] = e.target.value.split(':');
                      setSelectedEnrollment({ id: id as Id<"enrollments">, amount: Number(amount) });
                    }}
                  >
                    <option value="">Select an enrollment</option>
                    {enrollments.map((enrollment: Enrollment) => (
                      <option key={enrollment._id} value={`${enrollment._id}:${enrollment.amount}`}>
                        {enrollment.sport.name} - {enrollment.batch.name} ({formatAmount(enrollment.amount)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkInvoiceModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedEnrollment && handleGenerateBulkInvoices(selectedEnrollment.id, selectedEnrollment.amount)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  disabled={!selectedEnrollment || selectedStudents.length === 0 || loading}
                >
                  {loading ? 'Generating...' : 'Generate Invoices'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 