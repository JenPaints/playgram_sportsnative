import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Shield, AlertTriangle, Lock, UserCog, Activity, Trash2, Plus, RefreshCw } from "lucide-react";

interface Session {
  _id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

interface ErrorLog {
  _id: string;
  level: string;
  message: string;
  stack?: string;
  timestamp: string;
}

export const SettingsTab: React.FC = () => {
  const _user = useQuery(api.auth.loggedInUser);
  const sessions = useQuery(api.auth.getAllSessions);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipBlockingEnabled, setIpBlockingEnabled] = useState(false);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [newIpToBlock, setNewIpToBlock] = useState("");
  const [securityHeadersEnabled, setSecurityHeadersEnabled] = useState(false);
  const [accessControlEnabled, setAccessControlEnabled] = useState(false);
  const [scanningEnabled, setScanningEnabled] = useState(false);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<{ severity: string; message: string }[]>([]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/audit-logs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAuditLogs(data);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch audit logs",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchErrorLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/error-logs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setErrorLogs(data);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch error logs",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch error logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchAuditLogs();
    void fetchErrorLogs();
  }, [fetchAuditLogs, fetchErrorLogs]);

  const handlePasswordPolicyChange = (field: keyof typeof passwordPolicy, value: number | boolean) => {
    setPasswordPolicy((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle2FA = () => {
    setTwoFactorEnabled((prev) => !prev);
  };

  const handleIpBlockingToggle = () => {
    setIpBlockingEnabled((prev) => !prev);
  };

  const handleAddIpToBlockList = () => {
    if (newIpToBlock && !blockedIps.includes(newIpToBlock)) {
      setBlockedIps((prev) => [...prev, newIpToBlock]);
      setNewIpToBlock("");
    }
  };

  const handleRemoveIpFromBlockList = (ip: string) => {
    setBlockedIps((prev) => prev.filter((i) => i !== ip));
  };

  const handleSecurityHeaderToggle = () => {
    setSecurityHeadersEnabled((prev) => !prev);
  };

  const handleAccessControlToggle = () => {
    setAccessControlEnabled((prev) => !prev);
  };

  const handleRunSecurityScan = async () => {
    try {
      setLoading(true);
      // Simulate security scan
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const results = [
        { severity: "high", message: "Outdated dependencies detected" },
        { severity: "medium", message: "Missing security headers" },
        { severity: "low", message: "Weak password policy" },
      ];
      setScanResults(results);
      setLastScanDate(new Date().toISOString());
      toast({
        title: "Security Scan Complete",
        description: "Scan completed successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to run security scan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Password Policy</h3>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="minLength">Minimum Length</Label>
                <Select
                  value={passwordPolicy.minLength.toString()}
                  onValueChange={(value) => handlePasswordPolicyChange("minLength", parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireUppercase">Require Uppercase</Label>
                <Switch
                  id="requireUppercase"
                  checked={passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => handlePasswordPolicyChange("requireUppercase", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireLowercase">Require Lowercase</Label>
                <Switch
                  id="requireLowercase"
                  checked={passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => handlePasswordPolicyChange("requireLowercase", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireNumbers">Require Numbers</Label>
                <Switch
                  id="requireNumbers"
                  checked={passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => handlePasswordPolicyChange("requireNumbers", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                <Switch
                  id="requireSpecialChars"
                  checked={passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) => handlePasswordPolicyChange("requireSpecialChars", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="2fa">Enable 2FA</Label>
                <Switch
                  id="2fa"
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">IP Blocking</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ipBlocking">Enable IP Blocking</Label>
                <Switch
                  id="ipBlocking"
                  checked={ipBlockingEnabled}
                  onCheckedChange={handleIpBlockingToggle}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter IP address"
                  value={newIpToBlock}
                  onChange={(e) => setNewIpToBlock(e.target.value)}
                />
                <Button onClick={handleAddIpToBlockList} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {blockedIps.map((ip) => (
                  <div key={ip} className="flex items-center justify-between">
                    <span className="text-sm">{ip}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIpFromBlockList(ip)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Security Headers</h3>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="securityHeaders">Enable Security Headers</Label>
                <Switch
                  id="securityHeaders"
                  checked={securityHeadersEnabled}
                  onCheckedChange={handleSecurityHeaderToggle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Access Control</h3>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="accessControl">Enable Access Control</Label>
                <Switch
                  id="accessControl"
                  checked={accessControlEnabled}
                  onCheckedChange={handleAccessControlToggle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Security Scanning</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scanning">Enable Regular Scanning</Label>
                <Switch
                  id="scanning"
                  checked={scanningEnabled}
                  onCheckedChange={(checked) => setScanningEnabled(checked)}
                />
              </div>
              <Button
                onClick={() => void handleRunSecurityScan()}
                className="w-full"
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Security Scan
              </Button>
              {lastScanDate && (
                <div className="text-sm text-muted-foreground">
                  Last scan: {new Date(lastScanDate).toLocaleString()}
                </div>
              )}
              {scanResults.length > 0 && (
                <div className="space-y-2">
                  {scanResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <Badge
                        variant={
                          result.severity === "high"
                            ? "destructive"
                            : result.severity === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {result.severity}
                      </Badge>
                      <span>{result.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Active Sessions</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>User Agent</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session._id}>
                  <TableCell>{session.ip || "-"}</TableCell>
                  <TableCell>{session.userAgent || "-"}</TableCell>
                  <TableCell>{new Date(session.lastActive).toLocaleString()}</TableCell>
                  <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Audit Logs</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Error Logs</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Stack</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>
                    <Badge
                      variant={
                        log.level === "error"
                          ? "destructive"
                          : log.level === "warn"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.stack}</TableCell>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
import LoadingSpinner from "../components/ui/LoadingSpinner";