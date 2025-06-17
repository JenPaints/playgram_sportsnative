import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { performance } from 'perf_hooks';
import os from 'os';

interface PerformanceData {
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

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private activeConnections: Set<WebSocket> = new Set();
  private metrics: PerformanceData = {
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
  };

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private async collectMetrics(): Promise<PerformanceData> {
    const startTime = performance.now();
    
    // Collect system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Simulate network latency (replace with actual measurement in production)
    const networkLatency = Math.random() * 100;

    // Update metrics
    this.metrics = {
      ...this.metrics,
      serverLoad: cpuUsage,
      memoryUsage,
      cpuUsage,
      networkLatency,
      apiResponseTime: performance.now() - startTime
    };

    return this.metrics;
  }

  private startMonitoring(): void {
    setInterval(() => {
      void this.collectMetrics().then(metrics => {
        this.broadcastMetrics(metrics);
      });
    }, 5000); // Update every 5 seconds
  }

  public addConnection(ws: WebSocket): void {
    this.activeConnections.add(ws);
    ws.send(JSON.stringify(this.metrics));
  }

  public removeConnection(ws: WebSocket): void {
    this.activeConnections.delete(ws);
  }

  private broadcastMetrics(metrics: PerformanceData): void {
    const data = JSON.stringify(metrics);
    this.activeConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  public getMetrics(): PerformanceData {
    return this.metrics;
  }
}

// Create HTTP server
const server = createServer((req, res) => {
  if (req.url === '/api/performance-metrics') {
    const metrics = PerformanceMonitor.getInstance().getMetrics();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  PerformanceMonitor.getInstance().addConnection(ws);

  ws.on('close', () => {
    PerformanceMonitor.getInstance().removeConnection(ws);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Performance monitoring server running on port ${PORT}`);
}); 