import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function SystemHealthCard() {
  const metrics = useQuery(api.systemHealth.getSystemMetrics);
  const runTest = useMutation(api.systemHealth.runStressTest);

  if (!metrics) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "text-green-500";
      case "fail":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "fail":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runTest()}
          disabled={metrics.testStatus === "pending"}
        >
          Run Test
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Test Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Test Status</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(metrics.testStatus)}
              <span className={getStatusColor(metrics.testStatus)}>
                {metrics.testStatus.charAt(0).toUpperCase() + metrics.testStatus.slice(1)}
              </span>
            </div>
          </div>

          {/* Response Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response Time</span>
              <span className="text-sm font-medium">{metrics.responseTime.toFixed(2)}ms</span>
            </div>
            <Progress value={Math.min(metrics.responseTime / 1000 * 100, 100)} />
          </div>

          {/* Error Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Error Rate</span>
              <span className="text-sm font-medium">{metrics.errorRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.errorRate} 
              className={metrics.errorRate > 5 ? "bg-red-500" : ""}
            />
          </div>

          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CPU Usage</span>
              <span className="text-sm font-medium">{metrics.cpuUsage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.cpuUsage} 
              className={metrics.cpuUsage > 80 ? "bg-red-500" : ""}
            />
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Memory Usage</span>
              <span className="text-sm font-medium">{metrics.memoryUsage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.memoryUsage} 
              className={metrics.memoryUsage > 80 ? "bg-red-500" : ""}
            />
          </div>

          {/* Active Users */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Users</span>
            <span className="text-sm font-medium">{metrics.activeUsers}</span>
          </div>

          {/* Total Requests */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Requests</span>
            <span className="text-sm font-medium">{metrics.totalRequests}</span>
          </div>

          {/* Last Test Time */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Test</span>
            <span className="text-sm font-medium">
              {new Date(metrics.lastTestTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 