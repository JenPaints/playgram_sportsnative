import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function AnalyticsTab() {
  const stats = useQuery(api.analytics.getStats);

  if (!stats) {
    return <div className="flex justify-center items-center h-64 text-muted-foreground">Loading analytics...</div>;
  }

  // Prepare data for charts
  const revenueBySportData = Object.entries(stats.revenueBySport || {}).map(([sport, revenue]) => ({ name: sport, revenue }));
  const revenueByProductData = Object.entries(stats.revenueByProduct || {}).map(([product, revenue]) => ({ name: product, revenue }));
  const roleDistData = Object.entries(stats.roleDistribution || {}).map(([role, count]) => ({ name: role, count }));
  const subscriptionStatsData = Object.entries(stats.subscriptionStats || {}).map(([status, count]) => ({ name: status, count }));

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">📊 Analytics</h2>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
            <CardTitle className="text-muted-foreground">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.userGrowth ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="admin-card p-6 border-l-4 border-primary shadow-lg">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.activeUsers ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="admin-card p-6 border-l-4 border-primary shadow-lg">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Merch Sold / Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalMerchandiseSold ?? 0} items</div>
            <div className="text-lg text-primary">₹{stats.totalMerchandiseRevenue?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Sport */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Revenue by Sport</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueBySportData.length === 0 ? (
            <div className="text-muted-foreground">No data</div>
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

      {/* Revenue by Product */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Revenue by Product</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByProductData.length === 0 ? (
            <div className="text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByProductData} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#f472b6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {roleDistData.length === 0 ? (
            <div className="text-muted-foreground">No data</div>
          ) : (
            <div className="space-y-2">
              {roleDistData.map((role) => (
                <div key={role.name} className="flex items-center gap-4">
                  <div className="w-32 font-medium capitalize">{role.name}</div>
                  <Progress value={role.count} max={stats.userGrowth || 1} className="flex-1" />
                  <div className="w-10 text-right">{role.count}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status Distribution */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionStatsData.length === 0 ? (
            <div className="text-muted-foreground">No data</div>
          ) : (
            <div className="space-y-2">
              {subscriptionStatsData.map((status) => (
                <div key={status.name} className="flex items-center gap-4">
                  <div className="w-32 font-medium capitalize">{status.name}</div>
                  <Progress value={status.count} max={stats.userGrowth || 1} className="flex-1" />
                  <div className="w-10 text-right">{status.count}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 