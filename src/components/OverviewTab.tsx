import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemHealthCard } from "./SystemHealthCard";
import { Doc } from "../../convex/_generated/dataModel";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "./ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

const COLORS = ["#6366f1", "#f59e42", "#10b981", "#f43f5e", "#fbbf24", "#3b82f6"];

interface UserWithProfile extends Doc<"profiles"> {
  email?: string;
  deleted?: boolean;
}

export function OverviewTab() {
  const stats = useQuery(api.payments.getPaymentStats);
  const users = useQuery(api.users.getAllUsers) as UserWithProfile[] | undefined;
  const analytics = useQuery(api.analytics.getStats);
  const recentActivity = useQuery(api.users.listRecentActivity);
  const outstandingInvoices = useQuery(api.payments.listPayments, { status: "pending" });
  const sessions = useQuery(api.auth.getAllSessions);
  const systemHealth = useQuery(api.systemHealth.getSystemMetrics);
  const errorLogs = useQuery(api.auth.getErrorLogs);

  // Helper function to safely format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "₹0.00";
    return `₹${value.toFixed(2)}`;
  };

  // Helper function to safely format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "0";
    return value.toFixed(1);
  };

  // Calculate success rate from payment stats
  const calculateSuccessRate = () => {
    if (!stats) return 0;
    const total = stats.completedPayments + stats.failedPayments;
    if (total === 0) return 0;
    return (stats.completedPayments / total) * 100;
  };

  // Calculate active users
  const activeUsers = users?.filter(user => !user.deleted).length ?? 0;

  // Prepare data for charts
  const revenueBySportData = useMemo(() => Object.entries(analytics?.revenueBySport || {}).map(([sport, revenue]) => ({ name: sport, revenue })), [analytics]);
  const roleDistData = useMemo(() => Object.entries(analytics?.roleDistribution || {}).map(([role, count]) => ({ name: role, count })), [analytics]);
  const merchData = useMemo(() => Object.entries(analytics?.revenueByProduct || {}).map(([product, revenue]) => ({ name: product, revenue })), [analytics]);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue)}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.completedPayments ?? 0} completed payments
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              {activeUsers} active accounts
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPayments ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              Awaiting completion
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(calculateSuccessRate())}%
            </div>
            <div className="text-xs text-muted-foreground">
              Of total transactions
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merch Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMerchandiseSold ?? <Skeleton className="h-6 w-20" />}</div>
            <div className="text-xs text-muted-foreground">
              Revenue: ₹{analytics?.totalMerchandiseRevenue?.toLocaleString() ?? <Skeleton className="h-4 w-16" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Sport */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Revenue by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueBySportData.length === 0 ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueBySportData} margin={{ left: 10, right: 10 }}>
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        {/* User Role Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {roleDistData.length === 0 ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-2">
                {roleDistData.map((role) => (
                  <div key={role.name} className="flex items-center gap-4">
                    <div className="w-32 font-medium capitalize">{role.name}</div>
                    <Progress value={role.count} max={analytics?.userGrowth || 1} className="flex-1" />
                    <div className="w-10 text-right">{role.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recentActivity?.map((activity, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">{activity.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
              </li>
            )) || <Skeleton className="h-6 w-full" />}
          </ul>
        </CardContent>
      </Card>

      {/* Outstanding Invoices */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {outstandingInvoices?.length ? outstandingInvoices.slice(0, 5).map((inv, idx) => (
              <li key={inv._id} className="flex items-center gap-3">
                <span className="text-sm font-medium">{("user" in inv && inv.user?.name) ? inv.user.name : inv._id}</span>
                <span className="ml-auto text-xs text-orange-500">₹{inv.amount?.toLocaleString()}</span>
              </li>
            )) : <span className="text-muted-foreground text-sm">No outstanding invoices</span>}
          </ul>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sessions?.filter(s => s.isActive).length ?? <Skeleton className="h-6 w-20" />}</div>
          <ul className="space-y-1 mt-2">
            {sessions?.filter(s => s.isActive).slice(0, 5).map((s, idx) => (
              <li key={s._id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>User: {s.userId}</span>
                <span className="ml-auto">Last Active: {new Date(s.lastActive).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* System Health & Error Logs */}
      <div className="grid gap-4 md:grid-cols-2">
        <SystemHealthCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {errorLogs?.slice(0, 5).map((log, idx) => (
                <li key={log._id} className="text-xs text-red-500">
                  [{log.level}] {log.message} <span className="text-muted-foreground">({new Date(log.timestamp).toLocaleString()})</span>
                </li>
              )) || <Skeleton className="h-6 w-full" />}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 