import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
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
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  enrollment?: {
    sportId: Id<"sports">;
    batchId: Id<"batches">;
    sport?: { name: string };
    batch?: { name: string };
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

  const invoices = useQuery(api.payments.listPayments, {
    status: filterStatus === "all" ? undefined : filterStatus,
    startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
    endDate: dateRange.end ? new Date(dateRange.end).getTime() : undefined,
  }) as Invoice[] || [];

  const usersQuery = useQuery(api.users.listUsers, {});
  const enrollmentsQuery = useQuery(api.enrollments.listEnrollments, {});

  const users = usersQuery?.map((user: { _id: Id<"users">; name?: string; email?: string }) => ({
    _id: user._id,
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
  })) || [];

  const enrollments = enrollmentsQuery || [];

  const filteredPayments = invoices.filter(payment => {
    const searchStr = `${payment.user?.name} ${payment.user?.email} ${payment.enrollment?.sport?.name} ${payment.enrollment?.batch?.name} ${payment.transactionId || ''}`.toLowerCase();
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

  if (!invoices) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🧾 Invoices</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            className="admin-input"
            placeholder="Search by user, email, or invoice ID"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="admin-input"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="attempted">Attempted</option>
          </select>
          <input
            type="date"
            className="admin-input"
            value={dateRange.start}
            onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
          />
          <input
            type="date"
            className="admin-input"
            value={dateRange.end}
            onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Invoice ID</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((inv) => (
                <tr key={inv._id} className="border-b border-border hover:bg-muted transition">
                  <td className="p-3 font-mono text-xs">{inv._id}</td>
                  <td className="p-3">{inv.user?.name || inv.userId}</td>
                  <td className="p-3">₹{inv.amount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inv.status === "completed" ? "bg-green-100 text-green-700" : inv.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3">{inv.method}</td>
                  <td className="p-3">{new Date(inv.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => { setSelectedInvoice(inv); setModalOpen(true); }}
                      title="View Details"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Invoice Details Modal */}
      {modalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-md">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-2xl font-bold mb-4 text-center">Invoice Details</div>
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Invoice ID:</span> <span className="font-mono text-xs">{selectedInvoice._id}</span>
                </div>
                <div>
                  <span className="font-semibold">User:</span> {selectedInvoice.user?.name || selectedInvoice.userId}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {selectedInvoice.user?.email || "-"}
                </div>
                <div>
                  <span className="font-semibold">Amount:</span> ₹{selectedInvoice.amount}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedInvoice.status === "completed" ? "bg-green-100 text-green-700" : selectedInvoice.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}</span>
                </div>
                <div>
                  <span className="font-semibold">Method:</span> {selectedInvoice.method}
                </div>
                <div>
                  <span className="font-semibold">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}
                </div>
                {selectedInvoice.transactionId && (
                  <div>
                    <span className="font-semibold">Transaction ID:</span> <span className="font-mono text-xs">{selectedInvoice.transactionId}</span>
                  </div>
                )}
                {selectedInvoice.notes && (
                  <div>
                    <span className="font-semibold">Notes:</span> {selectedInvoice.notes}
                  </div>
                )}
                {selectedInvoice.enrollment?.sport?.name && (
                  <div>
                    <span className="font-semibold">Sport:</span> {selectedInvoice.enrollment.sport.name}
                  </div>
                )}
                {selectedInvoice.enrollment?.batch?.name && (
                  <div>
                    <span className="font-semibold">Batch:</span> {selectedInvoice.enrollment.batch.name}
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 left-0 right-0 bg-card flex justify-end gap-2 pt-4 border-t border-border -mx-6 px-6 pb-2 mt-6">
                <button type="button" className="admin-button-secondary" onClick={() => setModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 