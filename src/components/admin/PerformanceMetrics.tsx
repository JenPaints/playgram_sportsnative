import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Users, Server, Cpu, Wifi, AlertTriangle, TrendingUp, Gauge } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  activeUsers: number;
  serverLoad: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  requestsPerMinute: number;
  averageResponseTime: number;
}

interface MetricHistory {
  timestamp: number;
  value: number;
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    activeUsers: 0,
    serverLoad: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    errorRate: 0,
    requestsPerMinute: 0,
    averageResponseTime: 0
  });

  const [history, setHistory] = useState<{
    [key: string]: MetricHistory[];
  }>({
    serverLoad: [],
    memoryUsage: [],
    cpuUsage: [],
    networkLatency: [],
    errorRate: [],
    requestsPerMinute: []
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Measure page load time
    const pageLoadTime = performance.now();
    setMetrics(prev => ({ ...prev, pageLoadTime }));

    // Connect to WebSocket
    wsRef.current = new WebSocket('ws://localhost:3001');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data) as PerformanceMetrics;
      setMetrics(data);
      
      // Update history
      const timestamp = Date.now();
      setHistory(prev => {
        const newHistory = { ...prev };
        Object.entries(data).forEach(([key, value]) => {
          if (key in prev) {
            newHistory[key] = [
              ...prev[key],
              { timestamp, value }
            ].slice(-20); // Keep last 20 data points
          }
        });
        return newHistory;
      });
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getMetricColor = (value: number, type: 'load' | 'time' | 'users' | 'error') => {
    if (type === 'load') {
      return value > 80 ? 'text-red-500' : value > 60 ? 'text-yellow-500' : 'text-green-500';
    }
    if (type === 'time') {
      return value > 2000 ? 'text-red-500' : value > 1000 ? 'text-yellow-500' : 'text-green-500';
    }
    if (type === 'error') {
      return value > 5 ? 'text-red-500' : value > 2 ? 'text-yellow-500' : 'text-green-500';
    }
    return 'text-blue-500';
  };

  const getChartData = (metric: string) => {
    const data = history[metric] || [];
    return {
      labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: metric,
          data: data.map(d => d.value),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  return (
    <div className="space-y-8">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Page Load Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Page Load Time</h3>
            <Clock className="text-blue-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.pageLoadTime, 'time')}`}>
            {metrics.pageLoadTime.toFixed(0)}ms
          </div>
        </motion.div>

        {/* API Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">API Response Time</h3>
            <Zap className="text-yellow-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.apiResponseTime, 'time')}`}>
            {metrics.apiResponseTime.toFixed(0)}ms
          </div>
        </motion.div>

        {/* Active Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Users</h3>
            <Users className="text-green-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {metrics.activeUsers}
          </div>
        </motion.div>

        {/* Server Load */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Server Load</h3>
            <Activity className="text-purple-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.serverLoad, 'load')}`}>
            {metrics.serverLoad.toFixed(1)}%
          </div>
        </motion.div>

        {/* CPU Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
            <Cpu className="text-orange-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.cpuUsage, 'load')}`}>
            {metrics.cpuUsage.toFixed(1)}%
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
            <Server className="text-indigo-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.memoryUsage, 'load')}`}>
            {metrics.memoryUsage.toFixed(1)}%
          </div>
        </motion.div>

        {/* Network Latency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Network Latency</h3>
            <Wifi className="text-cyan-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.networkLatency, 'time')}`}>
            {metrics.networkLatency.toFixed(0)}ms
          </div>
        </motion.div>

        {/* Error Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Error Rate</h3>
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <div className={`text-3xl font-bold ${getMetricColor(metrics.errorRate, 'error')}`}>
            {metrics.errorRate.toFixed(1)}%
          </div>
        </motion.div>

        {/* Requests per Minute */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Requests/min</h3>
            <TrendingUp className="text-emerald-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {metrics.requestsPerMinute.toFixed(0)}
          </div>
        </motion.div>
      </div>

      {/* Historical Data Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">System Load History</h3>
          <Line
            data={getChartData('serverLoad')}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    color: 'white'
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  },
                  ticks: {
                    color: 'white'
                  }
                },
                x: {
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  },
                  ticks: {
                    color: 'white'
                  }
                }
              }
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Response Time History</h3>
          <Line
            data={getChartData('networkLatency')}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    color: 'white'
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  },
                  ticks: {
                    color: 'white'
                  }
                },
                x: {
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  },
                  ticks: {
                    color: 'white'
                  }
                }
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
} 