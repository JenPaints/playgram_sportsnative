import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

type PaymentStatus = "pending" | "completed" | "failed" | "attempted";

type FilterStatus = PaymentStatus | "all";

const COLORS = ["#6366f1", "#f59e42", "#10b981", "#f43f5e", "#fbbf24", "#3b82f6"];

export default function ReportsTab() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");

  const queryParams = {
    status: filterStatus === "all" ? undefined : filterStatus as PaymentStatus,
    startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
    endDate: dateRange.end ? new Date(dateRange.end).getTime() : undefined,
  };

  const payments = useQuery(api.payments.listPayments, queryParams) || [];
  const stats = useQuery(api.payments.getPaymentStats);

  // Filter by search
  const filteredPayments = payments.filter((p: any) => {
    if (!search.trim()) return true;
    const user = p.user || {};
    return (
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // --- Payment Success Rate Trends (by month) ---
  const paymentTrends = useMemo(() => {
    // Group by YYYY-MM
    const monthly: Record<string, { total: number; completed: number }> = {};
    payments.forEach((p: any) => {
      if (!p.createdAt) return;
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { total: 0, completed: 0 };
      monthly[key].total++;
      if (p.status === "completed") monthly[key].completed++;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { total, completed }]) => ({
        month,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
      }));
  }, [payments]);

  // --- Subscription vs One-Time Payment Pie Chart ---
  const paymentTypeData = useMemo(() => {
    // Assume method: 'subscription' or 'one_time' or other string
    const typeCounts: Record<string, number> = {};
    payments.forEach((p: any) => {
      let type = "Other";
      if (p.method?.toLowerCase().includes("sub")) type = "Subscription";
      else if (p.method?.toLowerCase().includes("one")) type = "One-Time";
      else if (p.method?.toLowerCase().includes("razorpay")) type = "One-Time";
      else if (p.method?.toLowerCase().includes("cash")) type = "One-Time";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [payments]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">📑 Reports</h2>
      {/* Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Success Rate Trends */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Payment Success Rate Trends</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            {paymentTrends.length === 0 ? (
              <div className="text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentTrends} margin={{ left: 10, right: 10 }}>
                  <XAxis dataKey="month" stroke="#888" fontSize={12} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} stroke="#888" fontSize={12} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={3} name="Success Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        {/* Subscription vs One-Time Payment Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Subscription vs One-Time Payments</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            {paymentTypeData.length === 0 ? (
              <div className="text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentTypeData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl shadow">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="admin-input w-40"
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
          onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="admin-input"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="admin-input"
        />
        <Input
          placeholder="Search user name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
      </div>
      {/* Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No payments found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p: any) => (
                  <TableRow key={p._id} className="hover:bg-muted transition">
                    <TableCell>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{p.user?.name || "-"}</TableCell>
                    <TableCell>{p.user?.email || "-"}</TableCell>
                    <TableCell>₹{p.amount?.toLocaleString() ?? 0}</TableCell>
                    <TableCell>{p.method || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        p.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : p.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : p.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : p.status === "attempted"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell>{p.enrollment?.sport?.name || "-"}</TableCell>
                    <TableCell>{p.enrollment?.batch?.name || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
          <Card className="admin-card p-6 border-l-4 border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{stats.totalRevenue?.toLocaleString() ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="admin-card p-6 border-l-4 border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.completedPayments ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="admin-card p-6 border-l-4 border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.pendingPayments ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="admin-card p-6 border-l-4 border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.failedPayments ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 