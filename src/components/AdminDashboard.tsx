import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { SignOutButton } from "../SignOutButton";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { toast } from "sonner";
import ProductsTab from "./ProductsTab";
import ContentTab from "./ContentTab";
import UsersTab from "./UsersTab";
import BatchesTab from "./BatchesTab";
import MessagingTab from "./MessagingTab";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart as RechartsLineChart, Legend, Line } from "recharts";
import { PaymentManagement } from "./admin/PaymentManagement";
import { Id } from "../../convex/_generated/dataModel";
import { Table, BarChart2, PieChart as PieChartIcon, Download, LayoutDashboard, Users, Dumbbell, Box as LucideBox, ShoppingCart, FileText, MessageSquare, Receipt, Gift, LineChart, Settings, Menu } from "lucide-react";
import OrdersTab from "./admin/OrdersTab";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { adminTheme } from "./adminTheme";
import { Capacitor } from '@capacitor/core';
import SettingsTab from "./SettingsTab";
import { loadRazorpayScript } from "../utils/loadRazorpayScript";

interface AdminDashboardProps {
  user: any;
}

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "sports", label: "Sports", icon: Dumbbell },
  { id: "batches", label: "Batches", icon: LucideBox },
  { id: "products", label: "Products", icon: ShoppingCart },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "content", label: "Content", icon: FileText },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "reports", label: "Reports", icon: Table },
  { id: "settings", label: "Settings", icon: Settings },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
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
    userId: Id<"users">;
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
  _creationTime: number;
}

interface Enrollment {
  _id: Id<"enrollments">;
  userId: Id<"users">;
  batchId: Id<"batches">;
  sportId: Id<"sports">;
  status: "active" | "inactive" | "completed";
  paymentStatus: "pending" | "paid" | "overdue";
  enrolledAt: number;
  _creationTime: number;
}

interface ChartData {
  name: string;
  value: number;
}

// Define a type for the recent activity data
interface RecentActivityItem {
  type: string;
  description: string;
  createdAt: number;
}

// Interface for Attendance Record (assuming this structure based on backend query output)
interface AttendanceRecord {
  _id: Id<"attendance">;
  userId: Id<"users">;
  batchId: Id<"batches">;
  date: string; // Or number if storing timestamp
  isPresent: boolean;
  method: string;
  notes?: string;
  timestamp: number;
  _creationTime: number;
}

// Define a new interface for the enriched attendance data returned by the backend query
interface EnrichedAttendanceRecord extends AttendanceRecord {
  user: { _id: Id<"users">; name?: string; email?: string; phone?: string; }; // Made properties optional to match potential query results
  batch: { _id: Id<"batches">; name?: string; }; // Made name optional
  sport: { _id: Id<"sports">; name?: string; }; // Made name optional
}

interface AnalyticsData {
  totalRevenue: number;
  userGrowth: number;
  activeUsers: number;
  revenueBySport: Array<{ name: string; revenue: number }>;
  roleDistribution: Array<{ name: string; value: number }>;
  subscriptionStats: Array<{ name: string; value: number }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
  totalMerchandiseSold?: number;
  totalMerchandiseRevenue?: number;
  revenueByProduct?: Record<string, number>;
}

interface SummaryData {
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
}

// Ensure UserProfile type has userId and optional firstName and lastName, and other relevant fields returned by getAllUsers
interface UserProfile {
  _id: Id<"profiles">;
  userId: Id<"users">; // Added userId to link profile to user
  email?: string; // Added email as optional
  name?: string; // Keep name optional, but it's often derived from firstName/lastName
  firstName?: string; // Added firstName as optional
  lastName?: string; // Added lastName as optional
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  joinedAt: number;
  _creationTime: number;
  role?: "student" | "coach" | "admin";
  subscriptionStatus?: "active" | "pending" | "expired";
  totalPoints?: number;
  level?: number;
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

// Fix Lucide icon usage for Chakra UI buttons
const getTabIcon = (IconComponent: any) => <IconComponent size={20} />;

const isNativeApp = Capacitor.isNativePlatform();

export function AdminDashboard({ user }: AdminDashboardProps) {
  if (isNativeApp) {
    return <div style={{padding: 32, textAlign: 'center', color: '#fff', fontSize: 20}}>Admin dashboard is only available on the website.</div>;
  }
  const [activeTab, setActiveTab] = useState("overview");
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);
  const profile = useQuery(api.users.getCurrentProfile);
  const sidebarBg = theme.palette.background.paper;
  const sidebarBorder = theme.palette.divider;
  const mainBg = theme.palette.background.default;

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', background: mainBg }}>
        <LoadingSpinner size="lg" />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: `linear-gradient(to bottom right, ${adminTheme.palette.background.default}, #000, ${adminTheme.palette.background.paper})` }}>
        {/* Header */}
        <Box sx={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${adminTheme.palette.divider}`, position: 'sticky', top: 0, zIndex: 50 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} maxWidth="1200px" mx="auto" px={2} py={2} alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" width="100%" gap={4} alignItems="center">
              {/* Hamburger for mobile */}
              <IconButton
                sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 2 }}
                aria-label="Open sidebar"
                onClick={onOpen}
                color="inherit"
              >
                <Menu size={24} />
              </IconButton>
              <Typography variant="h5" fontWeight="bold" sx={{ background: 'linear-gradient(to right, #fff, #e0e0e0)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                PlayGram Admin
              </Typography>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography component="span" color="text.secondary">Administrator </Typography>
                <Typography component="span" color="text.primary" fontWeight={600}>
                  {profile.profile?.firstName} {profile.profile?.lastName}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" width={{ xs: '100%', sm: 'auto' }} justifyContent="flex-end" gap={4}>
              <Box textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" color="text.secondary">System Status</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">Online</Typography>
              </Box>
              <SignOutButton />
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex' }}>
          {/* Sidebar Navigation */}
          {/* Desktop Sidebar */}
          <Stack
            direction="column"
            sx={{ display: { xs: 'none', md: 'flex' }, width: 256, background: adminTheme.palette.background.paper, borderRight: `2px solid ${adminTheme.palette.divider}`, minHeight: '100vh', p: 2, gap: 2 }}
          >
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                startIcon={getTabIcon(tab.icon)}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? "contained" : "text"}
                color={activeTab === tab.id ? "primary" : "secondary"}
                sx={{
                  justifyContent: 'flex-start',
                  fontWeight: 500,
                  fontSize: '1rem',
                  width: '100%',
                  borderRadius: 3,
                  boxShadow: activeTab === tab.id ? 3 : undefined,
                  background: activeTab === tab.id ? adminTheme.palette.primary.main : adminTheme.palette.background.paper,
                  color: activeTab === tab.id ? '#fff' : adminTheme.palette.text.secondary,
                  '&:hover': {
                    background: activeTab === tab.id ? adminTheme.palette.primary.dark : adminTheme.palette.secondary.main,
                    color: '#fff',
                  },
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
          {/* Mobile Sidebar Drawer */}
          <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { background: adminTheme.palette.background.paper, borderRight: `2px solid ${adminTheme.palette.divider}` } }}
          >
            <Box sx={{ width: 256 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <Typography color="text.primary" fontWeight="bold">Menu</Typography>
                <IconButton onClick={onClose} color="inherit">
                  <Menu size={24} />
                </IconButton>
              </Box>
              <Divider />
              <Stack direction="column" gap={2} sx={{ p: 2 }}>
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    startIcon={getTabIcon(tab.icon)}
                    onClick={() => { setActiveTab(tab.id); onClose(); }}
                    variant={activeTab === tab.id ? "contained" : "text"}
                    color={activeTab === tab.id ? "primary" : "secondary"}
                    sx={{
                      justifyContent: 'flex-start',
                      fontWeight: 500,
                      fontSize: '1rem',
                      width: '100%',
                      borderRadius: 3,
                      boxShadow: activeTab === tab.id ? 3 : undefined,
                      background: activeTab === tab.id ? adminTheme.palette.primary.main : adminTheme.palette.background.paper,
                      color: activeTab === tab.id ? '#fff' : adminTheme.palette.text.secondary,
                      '&:hover': {
                        background: activeTab === tab.id ? adminTheme.palette.primary.dark : adminTheme.palette.secondary.main,
                        color: '#fff',
                      },
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Drawer>
          {/* Main Content */}
          <Box sx={{ flex: 1, width: '100%', p: 2, overflowX: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "users" && <UsersTab />}
                {activeTab === "sports" && <SportsTab />}
                {activeTab === "batches" && <BatchesTab />}
                {activeTab === "products" && <ProductsTab />}
                {activeTab === "orders" && <OrdersTab />}
                {activeTab === "content" && <ContentTab />}
                {activeTab === "messaging" && <MessagingTab />}
                {activeTab === "invoices" && <InvoicesTab />}
                {activeTab === "rewards" && <RewardsTab />}
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "reports" && <ReportsTab />}
                {activeTab === "settings" && <SettingsTab />}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function OverviewTab() {
  const stats = useQuery(api.analytics.getStats);
  const recentActivity = useQuery(api.users.listRecentActivity);
  const incomeLastMonth = useQuery(api.payments.getTotalRevenueLastMonth);

  const totalRevenue = stats?.totalRevenue ?? 0;
  const userGrowth = stats?.userGrowth ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const incomeChange = incomeLastMonth ? (((totalRevenue - incomeLastMonth) / incomeLastMonth) * 100) : 0; // Calculate percentage change

  const calculatePercentageChange = (monthly: number | undefined, total: number | undefined): string => {
    if (monthly === undefined || total === undefined || total === 0) return "N/A";
    const change = (((total - monthly) / monthly) * 100);
     if (!isFinite(change)) return "N/A";
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };


  if (stats === undefined || recentActivity === undefined || incomeLastMonth === undefined) {
  return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Revenue (All Time)</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatAmount(totalRevenue)}</p>
           {/* Placeholder for monthly change if needed */}
           {/* <p className="text-sm">{calculatePercentageChange(incomeLastMonth, totalRevenue)} vs Last Month</p> */}
              </div>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-white mt-2">{userGrowth}</p>
            </div>
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-white mt-2">{activeUsers}</p>
        </div>
      </div>

      {/* Recent Activity / Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {recentActivity.map((activity, index) => (
              <li key={index} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                <p className="text-gray-300 text-sm">{activity.description}</p>
                <p className="text-gray-500 text-xs mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
              </li>
            ))}
             {recentActivity.length === 0 && (
                <li className="text-center text-gray-500 py-4">No recent activity found.</li>
              )}
          </ul>
                </div>

        {/* Placeholder for another quick stat/chart if needed */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
           <h3 className="text-lg font-semibold text-white mb-4">Quick Insights</h3>
           <p className="text-gray-400">More insights coming soon...</p>
              </div>
        </div>
    </div>
  );
}

function SportsTab() {
  const sports = useQuery(api.sports.getAllSports, {});
  const batches = useQuery(api.batches.getAllBatches, {});
  const payments = useQuery(api.payments.listPayments, {});
  const enrollments = useQuery(api.sports.getAllEnrollments, {});
  const createSport = useMutation(api.sports.createSport);
  const updateSport = useMutation(api.sports.updateSport);
  const deleteSport = useMutation(api.sports.deleteSport);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSport, setEditingSport] = useState<any>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    maxStudentsPerBatch: number;
    pricePerMonth: number;
    equipment: string[];
    ageGroups: string[];
    isActive: boolean;
  }>({
    name: "",
    description: "",
    maxStudentsPerBatch: 0,
    pricePerMonth: 0,
    equipment: [],
    ageGroups: [],
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingSport) {
        await updateSport({
          sportId: editingSport._id,
          ...form,
        });
      } else {
        await createSport(form);
      }
      setShowCreateModal(false);
      setEditingSport(null);
      setForm({
        name: "",
        description: "",
        maxStudentsPerBatch: 0,
        pricePerMonth: 0,
        equipment: [],
        ageGroups: [],
        isActive: true,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save sport");
    }
  };

  const handleEdit = (sport: any) => {
    setEditingSport(sport);
    setForm({
      name: sport.name,
      description: sport.description,
      maxStudentsPerBatch: sport.maxStudentsPerBatch,
      pricePerMonth: sport.pricePerMonth,
      equipment: sport.equipment || [],
      ageGroups: sport.ageGroups || [],
      isActive: sport.isActive,
    });
    setShowCreateModal(true);
  };

  if (sports === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sports Management</h2>
        <button
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold"
          onClick={() => setShowCreateModal(true)}
        >
          Add Sport
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-900 rounded-xl border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Max Students</th>
              <th className="py-3 px-4 text-left">Price/Month</th>
              <th className="py-3 px-4 text-left">Equipment</th>
              <th className="py-3 px-4 text-left">Age Groups</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sports.map((sport) => (
              <tr key={sport._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                <td className="py-2 px-4 text-white font-semibold">{sport.name}</td>
                <td className="py-2 px-4 text-gray-300">{sport.description}</td>
                <td className="py-2 px-4 text-gray-300">{sport.maxStudentsPerBatch}</td>
                <td className="py-2 px-4 text-gray-300">{formatAmount(sport.pricePerMonth)}</td>
                <td className="py-2 px-4 text-gray-300">{sport.equipment.join(", ")}</td>
                <td className="py-2 px-4 text-gray-300">{sport.ageGroups.join(", ")}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${sport.isActive ? "bg-green-700 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                {sport.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2 px-4 flex gap-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                onClick={() => handleEdit(sport)}
                  >Edit</button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                    onClick={() => deleteSport({ sportId: sport._id })}
                  >Delete</button>
                </td>
              </tr>
            ))}
            {sports.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-8">No sports found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Sport */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 rounded-xl p-8 w-full max-w-md space-y-4 border border-gray-700 shadow-xl animate-fadeIn"
          >
            <h3 className="text-xl font-bold text-white mb-2">{editingSport ? "Edit Sport" : "Add Sport"}</h3>
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Max Students Per Batch</label>
                <input name="maxStudentsPerBatch" type="number" value={form.maxStudentsPerBatch} onChange={e => setForm({ ...form, maxStudentsPerBatch: parseInt(e.target.value) })} required className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Price Per Month (INR)</label>
                <input name="pricePerMonth" type="number" step="0.01" value={form.pricePerMonth} onChange={e => setForm({ ...form, pricePerMonth: parseFloat(e.target.value) })} required className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Equipment (comma-separated)</label>
                <input name="equipment" value={form.equipment.join(', ')} onChange={e => setForm({ ...form, equipment: e.target.value.split(',').map(item => item.trim()) })} className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Age Groups (comma-separated)</label>
                <input name="ageGroups" value={form.ageGroups.join(', ')} onChange={e => setForm({ ...form, ageGroups: e.target.value.split(',').map(item => item.trim()) })} className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <label className="text-gray-300">Active</label>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingSport(null); }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  {editingSport ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  // 1. Data fetching hooks - always called in the same order
  const users = useQuery(api.users.getAllUsers, {});
  const sports = useQuery(api.sports.getAllSports, {});
  const batches = useQuery(api.batches.getAllBatches, {});
  const payments = useQuery(api.payments.listPayments, {});
  const enrollments = useQuery(api.sports.getAllEnrollments, {});
  const stats = useQuery(api.analytics.getStats);

  // 2. State hooks - always called in the same order
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Memoized calculations - always called in the same order
  const analyticsData = useMemo((): AnalyticsData | null => {
    if (!users || !sports || !batches || !payments || !enrollments || !stats) {
      return null;
    }

    try {
      // Calculate KPIs with proper null checks
      const totalRevenue = stats.totalRevenue ?? 0;
      const userGrowth = stats.userGrowth ?? 0;
      const activeUsers = stats.activeUsers ?? 0;
      const revenueBySport = Array.isArray(stats.revenueBySport)
        ? stats.revenueBySport
        : Object.entries(stats.revenueBySport ?? {}).map(([name, revenue]) => ({ name, revenue: revenue ?? 0 }));
      const roleDistribution = Array.isArray(stats.roleDistribution)
        ? stats.roleDistribution
        : Object.entries(stats.roleDistribution ?? {}).map(([name, value]) => ({ name, value: value ?? 0 }));
      const subscriptionStats = Array.isArray(stats.subscriptionStats)
        ? stats.subscriptionStats
        : Object.entries(stats.subscriptionStats ?? {}).map(([name, value]) => ({ name, value: value ?? 0 }));
      const revenueTrend = payments
        .filter(p => p.status === "completed")
        .reduce((acc, p) => {
          const date = new Date(p.createdAt).toLocaleDateString();
          const found = acc.find(a => a.date === date);
          if (found) found.revenue += (p.amount ?? 0);
          else acc.push({ date, revenue: p.amount ?? 0 });
          return acc;
        }, [] as { date: string; revenue: number }[])
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Merchandise analytics
      const totalMerchandiseSold = stats.totalMerchandiseSold ?? 0;
      const totalMerchandiseRevenue = stats.totalMerchandiseRevenue ?? 0;
      const revenueByProduct = stats.revenueByProduct ?? {};

      return {
        totalRevenue,
        userGrowth,
        activeUsers,
        revenueBySport,
        roleDistribution,
        subscriptionStats,
        revenueTrend,
        totalMerchandiseSold,
        totalMerchandiseRevenue,
        revenueByProduct,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing analytics data");
      return null;
    }
  }, [users, sports, batches, payments, enrollments, stats]);

  // 4. Effect hooks - always called in the same order
  useEffect(() => {
    if (users !== undefined && sports !== undefined && batches !== undefined && 
        payments !== undefined && enrollments !== undefined && stats !== undefined) {
      setIsLoading(false);
    }
  }, [users, sports, batches, payments, enrollments, stats]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show no data state
  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const {
    totalRevenue,
    userGrowth,
    activeUsers,
    revenueBySport,
    roleDistribution,
    subscriptionStats,
    revenueTrend,
    totalMerchandiseSold,
    totalMerchandiseRevenue,
    revenueByProduct,
  } = analyticsData;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatAmount(totalRevenue)}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-white mt-2">{userGrowth}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-white mt-2">{activeUsers}</p>
        </div>
      </div>

      {/* Merchandise KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-pink-600 to-fuchsia-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Merchandise Sold</h3>
          <p className="text-3xl font-bold text-white mt-2">{totalMerchandiseSold}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-600 to-yellow-500 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Merchandise Revenue</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatAmount(totalMerchandiseRevenue ?? 0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Sport */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Sport</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueBySport}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.8)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "0.5rem",
                  color: "#fff"
                }}
                formatter={(value) => [formatAmount(typeof value === 'number' ? value : Number(value) || 0), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Product (Merchandise) */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Merchandise Revenue by Product</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(revenueByProduct ?? {}).map(([name, revenue]) => ({ name, revenue: revenue ?? 0 }))}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.8)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "0.5rem",
                  color: "#fff"
                }}
                formatter={(value) => [formatAmount(typeof value === 'number' ? value : Number(value) || 0), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Roles Pie Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Roles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={roleDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.8)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "0.5rem",
                  color: "#fff"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Status Pie Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={subscriptionStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {subscriptionStats.map((entry, index) => (
                  <Cell key={`cell-sub-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.8)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "0.5rem",
                  color: "#fff"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={revenueTrend}>
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.8)",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "0.5rem",
                  color: "#fff"
                }}
                formatter={(value) => [formatAmount(typeof value === 'number' ? value : Number(value) || 0), "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={3} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

function InvoicesTab() {
  const invoices = useQuery(api.invoices.listInvoices, {});
  const markAsPaid = useMutation(api.payments.markAsPaid);
  const generateBulkInvoices = useMutation(api.payments.generateBulkInvoices);

  // State for Invoice Generation
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [step, setStep] = useState<"user" | "enrollment" | "payment">("user");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Existing Invoice Tab states
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "failed" | "attempted">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [tableSearchQuery, setTableSearchQuery] = useState(""); // Renamed to avoid conflict
  const [selectedStudents, setSelectedStudents] = useState<Id<"users">[]>([]);
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);

  const payments = useQuery(api.payments.listPayments, {
    status: filterStatus === "all" ? undefined : filterStatus,
    startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
    endDate: dateRange.end ? new Date(dateRange.end).getTime() : undefined,
  }) as Payment[] || [];

  const usersQuery = useQuery(api.users.listUsers) as unknown as User[] || [];
  const enrollmentsQuery = useQuery(api.enrollments.listEnrollments, { userId: selectedUser?._id }) as unknown as Enrollment[] || [];

  // Hooks for Invoice Generation (moved from GenerateInvoice.tsx)
  const createRazorpayOrder = useAction(api.razorpay.createRazorpayOrder);
  const verifyPayment = useAction(api.razorpay.verifyRazorpayPayment);
  const generateInvoiceMutation = useMutation(api.invoices.generateInvoice); // Renamed to avoid conflict
  const updateInvoiceStatus = useMutation(api.invoices.updateInvoiceStatus);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const filteredUsers = usersQuery.filter(user => 
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

    const amount = Number(selectedEnrollment.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setGenError("Invalid enrollment amount. Please check the enrollment details.");
      setGenLoading(false);
      return;
    }

    try {
      setGenLoading(true);
      setGenError("");

      const order = await createRazorpayOrder({
        amount: Math.round(amount * 100), // Razorpay expects paise (integer)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      const invoiceId = await generateInvoiceMutation({
        userId: selectedUser._id,
        enrollmentId: selectedEnrollment._id,
        amount: selectedEnrollment.amount,
        method: "razorpay",
      });

      await loadRazorpayScript();
      if (!window.Razorpay) {
        setGenError("Razorpay SDK not loaded");
        setGenLoading(false);
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
            const verification = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.verified) {
              await updateInvoiceStatus({
                id: invoiceId,
                status: "completed",
                transactionId: response.razorpay_payment_id,
              });

              // Reset form and show success (or close/redirect)
              setStep("user");
              setSelectedUser(null);
              setSelectedEnrollment(null);
              setSearchQuery("");

            } else {
              throw new Error("Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setGenError("Payment verification failed");
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
      setGenError("Failed to generate invoice");
    } finally {
      setGenLoading(false);
    }
  };

  const renderGenerateInvoiceSteps = () => {
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
              {enrollmentsQuery.map((enrollment: any) => ( // Use enrollmentsQuery directly
                <button
                  key={enrollment._id}
                  onClick={() => handleEnrollmentSelect(enrollment)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                  <p className="text-white font-medium">{enrollment.sport?.name || 'N/A'}</p>
                  <p className="text-gray-400 text-sm">{enrollment.batch?.name || 'N/A'}</p>
                  <p className="text-orange-400 font-bold mt-1">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR'
                    }).format(enrollment.amount)}
                  </p>
                </button>
              ))}
              {enrollmentsQuery.length === 0 && (
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
                <p className="text-white">{selectedEnrollment?.sport?.name || 'N/A'}</p>
                <p className="text-gray-400 text-sm">{selectedEnrollment?.batch?.name || 'N/A'}</p>
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
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setStep("user");
                  setSelectedUser(null);
                  setSelectedEnrollment(null);
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-gray-300 hover:text-white"
                disabled={genLoading}
              >
                Reset
              </button>
              <button
                onClick={handleGenerateInvoice}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={genLoading}
              >
                {genLoading ? "Processing..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        );
    }
  };

  // Filter payments for the table
  const filteredPayments = payments.filter((invoice) => {
    // Filter by search query (tableSearchQuery)
    const matchesSearch =
      tableSearchQuery === "" ||
      (invoice.user?.name?.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        invoice._id.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        invoice.user?.email?.toLowerCase().includes(tableSearchQuery.toLowerCase()));

    // Filter by status (already handled in payments query, but keep for safety)
    const matchesStatus =
      filterStatus === "all" || invoice.status === filterStatus;

    // Filter by date range
    const createdAt = invoice.createdAt;
    const matchesStart =
      !dateRange.start || createdAt >= new Date(dateRange.start).getTime();
    const matchesEnd =
      !dateRange.end || createdAt <= new Date(dateRange.end).getTime();

    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  // --- Handler stubs to prevent runtime errors ---
  function handleViewInvoice(invoice: Payment) {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  }
  function handleDownloadInvoice(invoice: Payment) {
    // TODO: Implement download logic
  }
  function handleSendInvoice(invoice: Payment) {
    // TODO: Implement send logic
  }
  function handleMarkAsPaid(invoice: Payment) {
    // TODO: Implement mark as paid logic
  }
  function handleGenerateBulkInvoices(enrollmentId: Id<"enrollments">, amount: number) {
    // TODO: Implement bulk invoice generation logic
  }

  if (!payments || !usersQuery || !enrollmentsQuery) {
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
        </div>
      </div>

      {genError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg">
          {genError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column for Invoice Generation */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Generate New Invoice</h3>
          {renderGenerateInvoiceSteps()}
        </div>

        {/* Right column for Existing Invoices Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Existing Invoices</h3>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search invoices..."
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 flex-grow"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "pending" | "completed" | "failed" | "attempted")}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="attempted">Attempted</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-900 rounded-xl border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="py-3 px-4 text-left">Invoice ID</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Method</th>
                  <th className="py-3 px-4 text-left">Student Name</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((invoice) => (
                  <tr key={invoice._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-2 px-4 text-white font-semibold">{invoice._id}</td>
                    <td className="py-2 px-4 text-orange-400 font-bold">{formatAmount(invoice.amount ?? 0)}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        getStatusColor(invoice.status)
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-400 text-xs">{formatDate(invoice.createdAt)}</td>
                    <td className="py-2 px-4 text-gray-300">{invoice.method}</td>
                    <td className="py-2 px-4 text-gray-300">{invoice.user?.name || 'N/A'}</td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-8">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
              className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl mx-4 shadow-xl border border-gray-700"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-white">Invoice Details</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-400 text-sm">Invoice Information</h4>
                    <p className="text-white">ID: {selectedInvoice._id}</p>
                    <p className="text-gray-300">Generated: {formatDate(selectedInvoice.createdAt)}</p>
                    {selectedInvoice.receiptNumber && (
                      <p className="text-gray-300">Receipt: {selectedInvoice.receiptNumber}</p>
                    )}
                    {selectedInvoice.paymentPeriod && (
                      <p className="text-gray-300">Period: {selectedInvoice.paymentPeriod}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-sm">Student Information</h4>
                    <p className="text-white">Name: {selectedInvoice.user?.name || 'N/A'}</p>
                    <p className="text-gray-300">Email: {selectedInvoice.user?.email || 'N/A'}</p>
                    <p className="text-gray-300">Phone: {selectedInvoice.user?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-400 text-sm">Enrollment Details</h4>
                    <p className="text-white">Sport: {selectedInvoice.enrollment?.sport?.name || 'N/A'}</p>
                    <p className="text-gray-300">Batch: {selectedInvoice.enrollment?.batch?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-sm">Payment Information</h4>
                    <p className="text-white">Amount: {formatAmount(selectedInvoice.amount ?? 0)}</p>
                    <p className="text-gray-300">Method: {selectedInvoice.method}</p>
                    <p className="text-gray-300">Status: {selectedInvoice.status}</p>
                    {selectedInvoice.transactionId && (
                      <p className="text-gray-300">Transaction ID: {selectedInvoice.transactionId}</p>
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
                    onClick={() => setShowMarkAsPaidModal(true)}
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
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-gray-700 p-3 rounded-lg">
                    {usersQuery.map((user) => (
                      <label key={user._id} className="flex items-center text-white text-sm">
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
                          className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        />
                        <span className="ml-2">{user.firstName} {user.lastName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Selected Students: {selectedStudents.length}</label>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select Enrollment</label>
                  <select
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
                    onChange={(e) => {
                      const selected = enrollmentsQuery.find((enrollment: any) => enrollment._id === e.target.value);
                      setSelectedEnrollment(selected || null);
                    }}
                  >
                    <option value="">Select an enrollment</option>
                    {enrollmentsQuery.map((enrollment: any) => (
                      <option key={enrollment._id} value={enrollment._id}>
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
                  onClick={() => selectedEnrollment && handleGenerateBulkInvoices(selectedEnrollment._id, selectedEnrollment.amount)}
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

      {/* Mark as Paid Modal */}
      <AnimatePresence>
        {showMarkAsPaidModal && selectedInvoice && (
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
              className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Mark Invoice as Paid</h3>
              <p className="text-gray-300 mb-4">Are you sure you want to mark this invoice as paid?</p>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowMarkAsPaidModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMarkAsPaid(selectedInvoice)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Marking..." : "Confirm Mark as Paid"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function RewardsTab() {
  const rewardList = useQuery(api.rewards.listRewards, {});
  const rewardHistoryList = useQuery(api.rewards.listRewardHistory, {});
  const rewardUsers = useQuery(api.users.getAllUsers, {}) as UserProfile[] | undefined;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [form, setForm] = useState<{
    name: string;
    type: "milestone" | "scratch_card";
    points: number;
    description: string;
    isActive: boolean;
  }>({
    name: "",
    type: "milestone",
    points: 0,
    description: "",
    isActive: true,
  });
  const createReward = useMutation(api.rewards.createReward);
  const updateReward = useMutation(api.rewards.updateReward);
  const deleteReward = useMutation(api.rewards.deleteReward);
  const [error, setError] = useState<string | null>(null);

  if (rewardList === undefined || rewardHistoryList === undefined || rewardUsers === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingReward) {
        await updateReward({
          rewardId: editingReward._id,
          ...form,
          type: form.type as "milestone" | "scratch_card",
        });
      } else {
        await createReward({
          ...form,
          type: form.type as "milestone" | "scratch_card",
        });
      }
      setShowCreateModal(false);
      setEditingReward(null);
      setForm({ name: "", type: "milestone", points: 0, description: "", isActive: true });
    } catch (err: any) {
      setError(err.message || "Failed to save reward");
    }
  };

  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    setForm({
      name: reward.name,
      type: reward.type,
      points: reward.points,
      description: reward.description,
      isActive: reward.isActive,
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white mb-4">Rewards & Gamification</h2>
        <button
          className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold"
          onClick={() => setShowCreateModal(true)}
        >
          Add Reward
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-900 rounded-xl border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Points</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rewardList.map((reward) => (
              <tr key={reward._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                <td className="py-2 px-4 text-white font-semibold">{reward.name}</td>
                <td className="py-2 px-4 text-yellow-400">{reward.type}</td>
                <td className="py-2 px-4 text-orange-400 font-bold">{reward.points}</td>
                <td className="py-2 px-4 text-gray-300">{reward.description}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${reward.isActive ? "bg-green-700 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                    {reward.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2 px-4 flex gap-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                    onClick={() => deleteReward({ rewardId: reward._id })}
                  >Delete</button>
                </td>
              </tr>
            ))}
            {rewardList.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">No rewards found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Reward */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 rounded-xl p-8 w-full max-w-md space-y-4 border border-gray-700 shadow-xl animate-fadeIn"
          >
            <h3 className="text-xl font-bold text-white mb-2">{editingReward ? "Edit Reward" : "Add Reward"}</h3>
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
            <div>
              <label className="block text-gray-300 mb-1">Name</label>
              <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Type</label>
              <select name="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "milestone" | "scratch_card" })} className="w-full p-2 rounded bg-gray-800 text-white">
                <option value="milestone">Milestone</option>
                <option value="scratch_card">Scratch Card</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Points</label>
              <input name="points" type="number" value={form.points} onChange={e => setForm({ ...form, points: parseInt(e.target.value) })} required className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label className="text-gray-300">Active</label>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">{editingReward ? "Update" : "Create"}</button>
              <button type="button" className="flex-1 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-semibold" onClick={() => { setShowCreateModal(false); setEditingReward(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {/* Reward History Table */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-white mb-2">Reward History</h3>
        <div className="overflow-x-auto">
          <table className="w-full bg-gray-900 rounded-xl border border-gray-700">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="py-3 px-4 text-left">Student</th>
                <th className="py-3 px-4 text-left">Reward</th>
                <th className="py-3 px-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {rewardHistoryList.map((entry: any) => {
                // Add null check and fallback for user name using userId
                const user = rewardUsers?.find((u: UserProfile) => u.userId === entry.userId); // Corrected comparison and explicit type
                const userName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || 'N/A' : entry.userId;
                const reward = rewardList.find((r: any) => r._id === entry.rewardId);
                return (
                  <tr key={entry._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-2 px-4 text-white">{userName}</td>
                    <td className="py-2 px-4 text-yellow-400">{reward ? reward.name : entry.rewardId}</td>
                    <td className="py-2 px-4 text-gray-400 text-xs">{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {rewardHistoryList.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-8">No reward history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  const handleViewInvoice = async (payment: Payment) => {
    // PDF generation is not available
    // You can show a toast or alert here
    // Example:
    // toast.error("PDF generation is not available.");
    alert("PDF generation is not available.");
  };
  const [reportType, setReportType] = useState<"payments" | "attendance">("payments");
  const payments = useQuery(api.payments.listPayments, {}) as Payment[] | undefined;
  const attendance = useQuery(api.attendance.listAttendance, {});
  const users = useQuery(api.users.getAllUsers, {}) as UserProfile[] | undefined;
  const batches = useQuery(api.batches.getAllBatches, {});
  const sports = useQuery(api.sports.getAllSports, {});

  const [paymentFilter, setPaymentFilter] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });

  const [attendanceFilter, setAttendanceFilter] = useState({
    batch: "",
    date: "",
  });

  const isLoading = payments === undefined || attendance === undefined || users === undefined || batches === undefined || sports === undefined;

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter(payment => {
      const matchesStatus = paymentFilter.status ? payment.status === paymentFilter.status : true;
      const paymentDate = new Date(payment.createdAt);
      const start = paymentFilter.startDate ? new Date(paymentFilter.startDate) : null;
      const end = paymentFilter.endDate ? new Date(paymentFilter.endDate) : null;
      const matchesDate = start && end ? paymentDate >= start && paymentDate <= end : true; // Corrected date comparison
      return matchesStatus && matchesDate;
    });
  }, [payments, paymentFilter]);

  const filteredAttendance = useMemo(() => {
    if (!attendance) return [];
    return attendance.filter(record => {
      const matchesBatch = attendanceFilter.batch ? record.batchId === attendanceFilter.batch : true;
      const matchesDate = attendanceFilter.date ? record.date === attendanceFilter.date : true;
      return matchesBatch && matchesDate;
    });
  }, [attendance, attendanceFilter]);

  const summary = useMemo((): SummaryData => {
    if (reportType === "payments" && filteredPayments) {
      return {
        totalAmount: filteredPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0),
        completedCount: filteredPayments.filter(p => p.status === "completed").length,
        pendingCount: filteredPayments.filter(p => p.status === "pending").length,
        failedCount: filteredPayments.filter(p => p.status === "failed").length,
        totalRecords: filteredPayments.length,
        presentCount: 0,
        absentCount: 0
      };
    } else if (reportType === "attendance" && filteredAttendance) {
      return {
        totalAmount: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        totalRecords: filteredAttendance.length,
        presentCount: filteredAttendance.filter(record => record.isPresent).length,
        absentCount: filteredAttendance.filter(record => !record.isPresent).length
      };
    }
    return {
      totalAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0
    };
  }, [filteredPayments, filteredAttendance, reportType]);

  const formatTooltipValue = (value: number | undefined, name: string): [string, string] => {
    if (value === undefined) return ["N/A", name];
    if (reportType === "payments") {
      return [formatAmount(value ?? 0), name];
    }
    return [value.toString(), name];
  };

  const exportCSV = () => {
    if (reportType === "payments" && filteredPayments) {
      const header = ["Invoice ID", "Amount", "Status", "Date", "Method", "Student Name", "Student ID", "Enrollment Sport", "Enrollment Batch"];
      const rows = filteredPayments.map(payment => [
        payment._id,
        payment.amount ?? 0,
        payment.status,
        new Date(payment.createdAt).toLocaleDateString(),
        payment.method,
        payment.user?.name ?? 'N/A',
        payment.userId,
        payment.enrollment?.sport?.name ?? 'N/A',
        payment.enrollment?.batch?.name ?? 'N/A',
      ]);
      const csvContent = [header.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "payments_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (reportType === "attendance" && filteredAttendance && users && batches && sports) { // Added sports check
       const header = ["Attendance ID", "Date", "Present", "Method", "Student Name", "Student ID", "Batch Name", "Sport Name"];
       const rows = filteredAttendance.map(record => {
         const user = users.find(u => u.userId === record.userId); // Corrected comparison
         const batch = batches.find(b => b._id === record.batchId);
         const sport = batch?.sportId ? sports.find(s => s._id === batch.sportId) : undefined;
         return [
            record._id,
            record.date,
            record.isPresent ? "Yes" : "No",
            record.method,
            user?.firstName || user?.name || 'N/A',
            user?.userId ?? 'N/A',
            batch?.name ?? 'N/A',
            sport?.name ?? 'N/A',
         ];
       });
       const csvContent = [header.join(","), ...rows.map(row => row.join(","))].join("\n");
       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
       const link = document.createElement("a");
       link.href = URL.createObjectURL(blob);
       link.setAttribute("download", "attendance_report.csv");
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-white mb-4">Reports</h2>
       <div className="flex gap-4 mb-6">
          <select
             value={reportType}
             onChange={(e) => setReportType(e.target.value as "payments" | "attendance")}
             className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          >
             <option value="payments">Payments Report</option>
             <option value="attendance">Attendance Report</option>
        </select>

          {reportType === "payments" && (
             <select
                value={paymentFilter.status}
                onChange={(e) => setPaymentFilter({ ...paymentFilter, status: e.target.value })}
                className="p-2 rounded bg-gray-800 text-white border border-gray-700"
             >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="attempted">Attempted</option>
        </select>
          )}

           {reportType === "attendance" && batches && (
             <select
                value={attendanceFilter.batch}
                onChange={(e) => setAttendanceFilter({ ...attendanceFilter, batch: e.target.value })}
                className="p-2 rounded bg-gray-800 text-white border border-gray-700"
             >
            <option value="">All Batches</option>
                {batches.map(batch => (
                   <option key={batch._id} value={batch._id}>{batch.name}</option>
                ))}
          </select>
        )}
           {reportType === "attendance" && (
              <input
                type="date"
                value={attendanceFilter.date}
                onChange={(e) => setAttendanceFilter({ ...attendanceFilter, date: e.target.value })}
                className="p-2 rounded bg-gray-800 text-white border border-gray-700"
              />
           )}

          <button
             onClick={exportCSV}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
             <Download size={18} /> Export CSV
          </button>
      </div>

        {/* Summary Cards */}
        {reportType === "payments" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Total Amount</h4>
                <p className="text-xl font-bold text-orange-400 mt-1">{formatAmount(summary.totalAmount)}</p>
             </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Completed</h4>
                <p className="text-xl font-bold text-green-400 mt-1">{summary.completedCount}</p>
             </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Pending</h4>
                <p className="text-xl font-bold text-yellow-400 mt-1">{summary.pendingCount}</p>
             </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Failed</h4>
                <p className="text-xl font-bold text-red-400 mt-1">{summary.failedCount}</p>
             </div>
          </div>
        )}
         {reportType === "attendance" && ( // Attendance Summary
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Total Records</h4>
                <p className="text-xl font-bold text-blue-400 mt-1">{summary.totalRecords}</p>
             </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Present</h4>
                <p className="text-xl font-bold text-green-400 mt-1">{summary.presentCount}</p>
             </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-md font-semibold text-white">Absent</h4>
                <p className="text-xl font-bold text-red-400 mt-1">{summary.absentCount}</p>
             </div>
          </div>
         )}

       {/* Data Table */}
      <div className="overflow-x-auto">
          {reportType === "payments" && filteredPayments && (
        <table className="w-full bg-gray-900 rounded-xl border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
                      <th className="py-3 px-4 text-left">Invoice ID</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Method</th>
                      <th className="py-3 px-4 text-left">Student Name</th>
                      <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
                   {filteredPayments.map((payment) => (
                      <tr key={payment._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                         <td className="py-2 px-4 text-white font-semibold">{payment._id}</td>
                         <td className="py-2 px-4 text-orange-400 font-bold">{formatAmount(payment.amount ?? 0)}</td>
                         <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                               payment.status === "completed" ? "bg-green-700 text-green-300" :
                               payment.status === "pending" ? "bg-yellow-700 text-yellow-300" :
                               payment.status === "failed" ? "bg-red-700 text-red-300" :
                               "bg-gray-700 text-gray-400"
                            }`}>
                               {payment.status}
                            </span>
                         </td>
                         <td className="py-2 px-4 text-gray-400 text-xs">{new Date(payment.createdAt).toLocaleDateString()}</td>
                         <td className="py-2 px-4 text-gray-300">{payment.method}</td>
                         <td className="py-2 px-4 text-gray-300">{payment.user?.name ?? 'N/A'}</td>
                         <td className="py-2 px-4 flex gap-2">
                            <button
                               onClick={() => handleViewInvoice(payment)}
                               className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            >
                               View Details
                            </button>
                         </td>
              </tr>
            ))}
                   {filteredPayments.length === 0 && (
                      <tr>
                         <td colSpan={9} className="text-center text-gray-500 py-8">No payments found for the selected filters.</td>
                      </tr>
            )}
          </tbody>
        </table>
          )}
           {reportType === "attendance" && filteredAttendance && users && batches && sports && ( // Added sports check
              <table className="w-full bg-gray-900 rounded-xl border border-gray-700">
                 <thead>
                   <tr className="border-b border-gray-700 text-gray-400">
                      <th className="py-3 px-4 text-left">Attendance ID</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Present</th>
                      <th className="py-3 px-4 text-left">Method</th>
                      <th className="py-3 px-4 text-left">Student Name</th>
                      <th className="py-3 px-4 text-left">Student ID</th>
                       <th className="py-3 px-4 text-left">Batch</th>
                       <th className="py-3 px-4 text-left">Sport</th>
                   </tr>
                 </thead>
                 <tbody>
                    {filteredAttendance.map((record) => {
                       const user = users?.find(u => u.userId === record.userId); // Corrected comparison
                       const batch = batches.find(b => b._id === record.batchId);
                        const sport = batch?.sportId ? sports.find(s => s._id === batch.sportId) : undefined;

                       return (
                          <tr key={record._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                             <td className="py-2 px-4 text-white font-semibold">{record._id}</td>
                             <td className="py-2 px-4 text-gray-300">{record.date}</td>
                             <td className="py-2 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${record.isPresent ? "bg-green-700 text-green-300" : "bg-red-700 text-red-300"}`}>
                                   {record.isPresent ? "Yes" : "No"}
                                </span>
                             </td>
                             <td className="py-2 px-4 text-gray-300">{record.method}</td>
                             <td className="py-2 px-4 text-white">{user?.firstName || user?.name || 'N/A'} {user?.lastName || ''}</td>
                             <td className="py-2 px-4 text-gray-300">{user?.userId ?? 'N/A'}</td>
                             <td className="py-2 px-4 text-yellow-400">{batch?.name ?? 'N/A'}</td>
                             <td className="py-2 px-4 text-orange-400">{sport?.name ?? 'N/A'}</td>
                          </tr>
                       );
                    })}
                     {filteredAttendance.length === 0 && (
                       <tr>
                          <td colSpan={9} className="text-center text-gray-500 py-8">No attendance records found for the selected filters.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           )}
      </div>
    </div>
  );
}
