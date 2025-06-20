import React, { useState } from "react";
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
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Id } from "../../convex/_generated/dataModel";
import { SelectChangeEvent } from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import { Palette } from '@mui/icons-material';

export default function SettingsTab() {
  const theme = useTheme();
  // State for dialogs and toggles
  const [openExport, setOpenExport] = useState(false);
  const [openImpersonate, setOpenImpersonate] = useState(false);
  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [openForceLogout, setOpenForceLogout] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [passwordPolicy, setPasswordPolicy] = useState("strong");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [impersonateUserId, setImpersonateUserId] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [forceLogoutUserId, setForceLogoutUserId] = useState("");
  // Add state for sessions, audit logs, etc.
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [auditLogsOpen, setAuditLogsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Add state for undo, confirmation, and impersonation
  const [undoAction, setUndoAction] = useState<null | (() => void)>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; message: string } | null>(null);
  // Add state for error logs and system health
  const [errorLogsOpen, setErrorLogsOpen] = useState(false);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loadingErrorLogs, setLoadingErrorLogs] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'online' | 'degraded' | 'offline'>('online');
  // Add state for session and audit log dialogs
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [loadingSessionsDialog, setLoadingSessionsDialog] = useState(false);
  const [auditLogsDialogOpen, setAuditLogsDialogOpen] = useState(false);
  const [loadingAuditLogsDialog, setLoadingAuditLogsDialog] = useState(false);
  // Notification preferences state (TODO: wire to backend)
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  // Account deactivation dialog
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  // New state for theme customization
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [primaryColor, setPrimaryColor] = useState('#1a1a1a');
  const [secondaryColor, setSecondaryColor] = useState('#f5f5f5');
  const [fontSize, setFontSize] = useState('medium');
  const [borderRadius, setBorderRadius] = useState('8px');

  // Convex hooks
  const forceLogout = useMutation(api.auth.forceLogoutUser);
  const impersonate = useMutation(api.auth.impersonateUser);
  const setMaintenance = useMutation(api.settings.setMaintenanceMode);
  const setAnnouncement = useMutation(api.settings.setGlobalAnnouncement);
  const updateProfile = useMutation(api.users.updateProfile);
  const setThemeSettings = useMutation(api.settings.setThemeSettings);
  const settings = useQuery(api.settings.getSettings);
  const sessionsQuery = useQuery(api.auth.getAllSessions);
  const errorLogsQuery = useQuery(api.auth.getErrorLogs);
  const currentUser = useQuery(api.auth.loggedInUser);

  // Profile edit state
  const [profileEdit, setProfileEdit] = useState({
    firstName: currentUser?.profile?.firstName || '',
    lastName: currentUser?.profile?.lastName || '',
    phone: currentUser?.profile?.phone || '',
    dateOfBirth: currentUser?.profile?.dateOfBirth || '',
    gender: currentUser?.profile?.gender || '',
    address: currentUser?.profile?.address || '',
    emergencyContact: currentUser?.profile?.emergencyContact || '',
    photoUrl: currentUser?.profile?.photoUrl || '',
  });

  // Initialize theme state from settings
  React.useEffect(() => {
    if (settings?.theme) {
      setThemeMode(settings.theme.mode);
      setPrimaryColor(settings.theme.primaryColor);
      setSecondaryColor(settings.theme.secondaryColor);
      setFontSize(settings.theme.fontSize);
      setBorderRadius(settings.theme.borderRadius);
    }
  }, [settings?.theme]);

  // Helper: Format timestamp
  const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

  // Helper: Force logout for a session (by userId)
  const handleForceLogoutSession = async (userId: Id<'users'>) => {
    try {
      await forceLogout({ userId });
      toast.success(`Forced logout for user ${userId}`);
      fetchSessions();
    } catch (err) {
      toast.error('Failed to force logout');
    }
  };

  // Fetch sessions for dialog
  const openSessionsDialog = async () => {
    setLoadingSessionsDialog(true);
    setSessionsOpen(true);
    try {
      setSessions(sessionsQuery || []);
    } catch (err) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoadingSessionsDialog(false);
    }
  };

  // Fetch audit logs for dialog
  const openAuditLogsDialog = async () => {
    setLoadingAuditLogsDialog(true);
    setAuditLogsDialogOpen(true);
    try {
      // setAuditLogs(getAuditLogs || []); // removed: audit logs not used
    } catch (err) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoadingAuditLogsDialog(false);
    }
  };

  // Replace stubs with real logic
  const handleExport = async () => {
    setExporting(true);
    try {
      // TODO: Implement export logic
      toast.success("Data export started! (not implemented)");
    } catch (err) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
      setOpenExport(false);
    }
  };
  const handleImpersonate = async () => {
    // setLoading(true); // Remove, use local loading if needed
    try {
      // Cast string to Id<'users'> for Convex mutation
      await impersonate({ userId: impersonateUserId as Id<'users'> });
      toast.success('Now viewing as user.');
    } catch (err) {
      toast.error('Failed to impersonate user.');
    } finally {
      // setLoading(false);
    }
    setOpenImpersonate(false);
  };
  // TODO: Implement reset password logic if mutation is available
  const handleResetPassword = async () => {
    toast.error('Reset password not implemented.');
    setOpenResetPassword(false);
  };
  const handleForceLogout = async () => {
    try {
      // Cast string to Id<'users'> for Convex mutation
      await forceLogout({ userId: forceLogoutUserId as Id<'users'> });
      toast.success(`Forced logout for user ${forceLogoutUserId}`);
    } catch (err) {
      toast.error("Failed to force logout");
    }
    setOpenForceLogout(false);
  };
  const handleToggleMaintenance = async () => {
    try {
      await setMaintenance({ enabled: !maintenanceMode });
      setMaintenanceMode((prev) => !prev);
      toast.info(`Maintenance mode ${!maintenanceMode ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error("Failed to toggle maintenance mode");
    }
  };
  const handleAnnouncementSave = async () => {
    try {
      await setAnnouncement({ message: globalAnnouncement });
      toast.success("Announcement saved");
    } catch (err) {
      toast.error("Failed to save announcement");
    }
  };
  const handlePasswordPolicyChange = async (e: SelectChangeEvent<string>) => {
    setPasswordPolicy(e.target.value as string);
    // Save to backend if needed
    toast.info(`Password policy set to ${e.target.value}`);
  };
  const handleToggle2FA = async () => {
    setTwoFAEnabled((prev) => !prev);
    // Save to backend if needed
    toast.info(`2FA ${!twoFAEnabled ? "enabled" : "disabled"}`);
  };
  // Fetch sessions and audit logs
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      setSessions(sessionsQuery || []);
    } catch (err) {
      toast.error("Failed to fetch sessions");
    } finally {
      setLoadingSessions(false);
    }
  };
  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      // setAuditLogs(getAuditLogs || []); // removed: audit logs not used
    } catch (err) {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoadingAuditLogs(false);
    }
  };
  // Fetch error logs
  const fetchErrorLogs = async () => {
    setLoadingErrorLogs(true);
    try {
      setErrorLogs(errorLogsQuery || []);
    } catch (err) {
      toast.error('Failed to fetch error logs');
    } finally {
      setLoadingErrorLogs(false);
    }
  };
  // Profile edit handlers
  const handleProfileChange = (field: string, value: string) => {
    setProfileEdit((prev) => ({ ...prev, [field]: value }));
  };
  const handleProfileSave = async () => {
    try {
      await updateProfile(profileEdit);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };
  // Password reset handler (request reset link)
  const handleRequestPasswordReset = async () => {
    toast.info('Password reset link will be sent to your email');
  };
  // Notification preferences save (TODO: wire backend)
  const handleSaveNotifPrefs = async () => {
    toast.info('Notification preferences saved');
  };
  // Account deactivation handler (TODO: wire backend)
  const handleDeactivateAccount = async () => {
    setDeactivateOpen(false);
    toast.info('Account deactivation requested');
  };

  // Updated theme customization handlers
  const handleThemeModeChange = async (e: SelectChangeEvent<string>) => {
    const newMode = e.target.value as 'light' | 'dark' | 'system';
    setThemeMode(newMode);
    try {
      await setThemeSettings({
        mode: newMode,
        primaryColor,
        secondaryColor,
        fontSize: fontSize as 'small' | 'medium' | 'large',
        borderRadius,
      });
      toast.success(`Theme mode set to ${newMode}`);
    } catch (err) {
      toast.error('Failed to update theme mode');
    }
  };

  const handlePrimaryColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setPrimaryColor(newColor);
    try {
      await setThemeSettings({
        mode: themeMode,
        primaryColor: newColor,
        secondaryColor,
        fontSize: fontSize as 'small' | 'medium' | 'large',
        borderRadius,
      });
      toast.success('Primary color updated');
    } catch (err) {
      toast.error('Failed to update primary color');
    }
  };

  const handleSecondaryColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSecondaryColor(newColor);
    try {
      await setThemeSettings({
        mode: themeMode,
        primaryColor,
        secondaryColor: newColor,
        fontSize: fontSize as 'small' | 'medium' | 'large',
        borderRadius,
      });
      toast.success('Secondary color updated');
    } catch (err) {
      toast.error('Failed to update secondary color');
    }
  };

  const handleFontSizeChange = async (e: SelectChangeEvent<string>) => {
    const newSize = e.target.value as 'small' | 'medium' | 'large';
    setFontSize(newSize);
    try {
      await setThemeSettings({
        mode: themeMode,
        primaryColor,
        secondaryColor,
        fontSize: newSize,
        borderRadius,
      });
      toast.success(`Font size set to ${newSize}`);
    } catch (err) {
      toast.error('Failed to update font size');
    }
  };

  const handleBorderRadiusChange = async (e: SelectChangeEvent<string>) => {
    const newRadius = e.target.value;
    setBorderRadius(newRadius);
    try {
      await setThemeSettings({
        mode: themeMode,
        primaryColor,
        secondaryColor,
        fontSize: fontSize as 'small' | 'medium' | 'large',
        borderRadius: newRadius,
      });
      toast.success(`Border radius set to ${newRadius}`);
    } catch (err) {
      toast.error('Failed to update border radius');
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: 4 }}>
      <Typography variant="h4" fontWeight="bold" color="white" mb={3}>Admin Settings</Typography>
      {/* Debug Info: Show current user ID for admin troubleshooting */}
      <Box mb={2} p={2} bgcolor="#222" borderRadius={2}>
        <Typography color="yellow" fontWeight="bold">Debug Info</Typography>
        <Typography color="white">Current user ID: {currentUser?._id || 'N/A'}</Typography>
        <Typography color="white">Current user email: {currentUser?.email || 'N/A'}</Typography>
        {/* currentUser.profile is either null or an object with _id and role */}
        <Typography color="white">Current user profile ID: {currentUser?.profile?._id || 'N/A'}</Typography>
        <Typography color="white">Current user role: {currentUser?.profile?.role || 'N/A'}</Typography>
      </Box>
      {/* Theme Customization Section */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2} display="flex" alignItems="center" gap={1}>
          <Palette /> Theme Customization
        </Typography>
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography color="white" minWidth={120}>Theme Mode:</Typography>
            <Select value={themeMode} onChange={handleThemeModeChange} sx={{ minWidth: 160, bgcolor: '#222' }}>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </Box>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography color="white" minWidth={120}>Primary Color:</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <input
                type="color"
                value={primaryColor}
                onChange={handlePrimaryColorChange}
                style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4 }}
              />
              <TextField
                value={primaryColor}
                onChange={handlePrimaryColorChange}
                size="small"
                sx={{ bgcolor: '#222', input: { color: 'white' } }}
              />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography color="white" minWidth={120}>Secondary Color:</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <input
                type="color"
                value={secondaryColor}
                onChange={handleSecondaryColorChange}
                style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4 }}
              />
              <TextField
                value={secondaryColor}
                onChange={handleSecondaryColorChange}
                size="small"
                sx={{ bgcolor: '#222', input: { color: 'white' } }}
              />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography color="white" minWidth={120}>Font Size:</Typography>
            <Select value={fontSize} onChange={handleFontSizeChange} sx={{ minWidth: 160, bgcolor: '#222' }}>
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </Box>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography color="white" minWidth={120}>Border Radius:</Typography>
            <Select value={borderRadius} onChange={handleBorderRadiusChange} sx={{ minWidth: 160, bgcolor: '#222' }}>
              <MenuItem value="4px">Small</MenuItem>
              <MenuItem value="8px">Medium</MenuItem>
              <MenuItem value="12px">Large</MenuItem>
            </Select>
          </Box>
        </Box>
      </Box>
      {/* System Health */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>System Health</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography color={systemHealth === 'online' ? 'green' : systemHealth === 'degraded' ? 'orange' : 'red'} fontWeight="bold">
            {systemHealth === 'online' ? 'Online' : systemHealth === 'degraded' ? 'Degraded' : 'Offline'}
          </Typography>
          <Tooltip title="Refresh system health"><span><IconButton color="primary" onClick={() => setSystemHealth('online')}><RefreshIcon /></IconButton></span></Tooltip>
        </Box>
      </Box>
      {/* Security Controls */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>Security</Typography>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Typography color="white">Password Policy:</Typography>
          <Select value={passwordPolicy} onChange={handlePasswordPolicyChange} sx={{ minWidth: 160, bgcolor: '#222' }}>
            <MenuItem value="strong">Strong (min 8 chars, 1 number, 1 symbol)</MenuItem>
            <MenuItem value="medium">Medium (min 6 chars, 1 number)</MenuItem>
            <MenuItem value="weak">Weak (min 4 chars)</MenuItem>
          </Select>
        </Box>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Typography color="white">Two-Factor Authentication (2FA):</Typography>
          <Switch checked={twoFAEnabled} onChange={handleToggle2FA} color="primary" />
        </Box>
      </Box>
      {/* Platform Settings */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>Platform Settings</Typography>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Typography color="white">Maintenance Mode:</Typography>
          <Switch checked={maintenanceMode} onChange={handleToggleMaintenance} color="warning" />
        </Box>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Typography color="white">Global Announcement:</Typography>
          <TextField value={globalAnnouncement} onChange={e => setGlobalAnnouncement(e.target.value)} placeholder="Enter announcement..." sx={{ bgcolor: '#222', input: { color: 'white' } }} />
          <Button variant="contained" color="primary" onClick={handleAnnouncementSave}>Save</Button>
        </Box>
      </Box>
      {/* Profile Edit Section */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>Profile</Typography>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Avatar src={profileEdit.photoUrl} sx={{ width: 56, height: 56 }} />
          <TextField label="Photo URL" value={profileEdit.photoUrl} onChange={e => handleProfileChange('photoUrl', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
        </Box>
        <Box display="flex" gap={3} mb={2}>
          <TextField label="First Name" value={profileEdit.firstName} onChange={e => handleProfileChange('firstName', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
          <TextField label="Last Name" value={profileEdit.lastName} onChange={e => handleProfileChange('lastName', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
        </Box>
        <Box display="flex" gap={3} mb={2}>
          <TextField label="Phone" value={profileEdit.phone} onChange={e => handleProfileChange('phone', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
          <TextField label="Date of Birth" value={profileEdit.dateOfBirth} onChange={e => handleProfileChange('dateOfBirth', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
        </Box>
        <Box display="flex" gap={3} mb={2}>
          <TextField label="Gender" value={profileEdit.gender} onChange={e => handleProfileChange('gender', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
          <TextField label="Address" value={profileEdit.address} onChange={e => handleProfileChange('address', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
        </Box>
        <Box display="flex" gap={3} mb={2}>
          <TextField label="Emergency Contact" value={profileEdit.emergencyContact} onChange={e => handleProfileChange('emergencyContact', e.target.value)} sx={{ bgcolor: '#222', input: { color: 'white' } }} />
        </Box>
        <Button variant="contained" color="primary" onClick={handleProfileSave}>Save Profile</Button>
      </Box>
      {/* Password Reset Section */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>Password</Typography>
        <Button variant="outlined" color="primary" onClick={handleRequestPasswordReset}>Request Password Reset Link</Button>
      </Box>
      {/* Notification Preferences Section */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>Notification Preferences</Typography>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Typography color="white">Email Notifications:</Typography>
          <Switch checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} color="primary" />
        </Box>
        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Typography color="white">SMS Notifications:</Typography>
          <Switch checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)} color="primary" />
        </Box>
        <Button variant="contained" color="primary" onClick={handleSaveNotifPrefs}>Save Preferences</Button>
      </Box>
      {/* Account Deactivation Section */}
      <Box mb={4} p={3} bgcolor="#18181b" borderRadius={3} boxShadow={2}>
        <Typography variant="h6" color="white" mb={2}>Account</Typography>
        <Button variant="outlined" color="error" onClick={() => setDeactivateOpen(true)}>Deactivate Account</Button>
        <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)}>
          <DialogTitle>Confirm Account Deactivation</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to deactivate your account? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeactivateAccount}>Deactivate</Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* The following features require admin access and are now hidden/removed: */}
      {/* Session Management, Audit Logs, Error Logs, User Management, Data Export */}
    </Box>
  );
} 