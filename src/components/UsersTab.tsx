import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";
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
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Capacitor } from '@capacitor/core';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-hot-toast';

interface UserProfile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  role: "student" | "coach" | "admin";
  sessionId: string;
  isActive: boolean;
  subscriptionStatus: "active" | "pending" | "expired";
  totalPoints: number;
  level: number;
  joinedAt: number;
}

const UsersTab: React.FC = () => {
  const users = useQuery(api.users.getAllUsers) as UserProfile[] || [];
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);
  const deleteUser = useMutation(api.users.deleteUser);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const updateSubscriptionStatus = useMutation(api.users.updateSubscriptionStatus);
  const restoreUser = useMutation(api.users.restoreUser);
  const impersonate = useMutation(api.users.impersonate);

  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    role: "student" as "student" | "coach" | "admin",
    isActive: true,
    subscriptionStatus: "active" as "active" | "pending" | "expired",
    level: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [undoAction, setUndoAction] = useState<null | (() => void)>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; message: string } | null>(null);

  const isNativeApp = Capacitor.isNativePlatform();

  const openAddModal = () => {
    setEditUser(null);
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      emergencyContact: "",
      role: "student",
      isActive: true,
      subscriptionStatus: "active",
      level: 1,
    });
    setModalOpen(true);
  };
  const openEditModal = (user: UserProfile) => {
    setEditUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      dateOfBirth: user.dateOfBirth || "",
      gender: user.gender || "",
      address: user.address || "",
      emergencyContact: user.emergencyContact || "",
      role: user.role,
      isActive: user.isActive,
      subscriptionStatus: user.subscriptionStatus,
      level: user.level,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editUser) {
        await updateUser({
          profileId: editUser._id,
          ...form,
        });
      } else {
        await createUser({ ...form });
      }
      closeModal();
    } catch (err) {
      setError("Failed to save user");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (profileId: Id<"profiles">) => {
    if (!window.confirm("Delete this user?")) return;
    setLoading(true);
    try {
      await deleteUser({ profileId });
    } catch (err) {
      setError("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };
  const handleRoleUpdate = async (profileId: Id<"profiles">, role: "student" | "coach" | "admin") => {
    setLoading(true);
    try {
      await updateUserRole({ profileId, role });
    } catch (err) {
      setError("Failed to update role");
    } finally {
      setLoading(false);
    }
  };
  const handleSubscriptionUpdate = async (profileId: Id<"profiles">, status: "active" | "pending" | "expired") => {
    setLoading(true);
    try {
      await updateSubscriptionStatus({ profileId, status });
    } catch (err) {
      setError("Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = (userId: Id<"users">) => {
    setConfirmDialog({
      open: true,
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      action: async () => {
        await deleteUser({ userId });
        setUndoAction(() => async () => {
          await restoreUser({ userId });
          toast.success('User restored!');
        });
        setUndoOpen(true);
        toast.success('User deleted.');
      },
    });
  };
  const handleImpersonate = async (userId: Id<"users">) => {
    setLoading(true);
    try {
      await impersonate({ userId });
      toast.success('Now viewing as user.');
    } catch (err) {
      toast.error('Failed to impersonate user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>👥 Users</Typography>
        <Button variant="contained" color="primary" onClick={openAddModal}>+ Add User</Button>
      </Box>
      <TableContainer component={Paper} sx={{ background: '#18181b', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Subscription</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{user.firstName} {user.lastName}</TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Tooltip title="Change the user's role. Only admins can assign admin role.">
                      <Select
                        value={user.role}
                        onChange={e => handleRoleUpdate(user._id, e.target.value as "student" | "coach" | "admin")}
                        sx={{ color: '#fff', background: '#23232a', borderRadius: 1 }}
                      >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="coach">Coach</MenuItem>
                        {!isNativeApp && <MenuItem value="admin">Admin</MenuItem>}
                      </Select>
                    </Tooltip>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ color: '#bbb' }}>{user.phone}</TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={user.subscriptionStatus}
                      onChange={e => handleSubscriptionUpdate(user._id, e.target.value as "active" | "pending" | "expired")}
                      sx={{ color: '#fff', background: '#23232a', borderRadius: 1 }}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ px: 1, py: 0.5, borderRadius: 1, fontWeight: 700, fontSize: 12, background: user.isActive ? '#166534' : '#374151', color: user.isActive ? '#bbf7d0' : '#d1d5db', display: 'inline-block' }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{user.level}</TableCell>
                <TableCell>
                  <Button size="small" variant="contained" color="info" sx={{ mr: 1 }} onClick={() => openEditModal(user)}>Edit</Button>
                  <Button size="small" variant="contained" color="error" onClick={() => handleDeleteUser(user.userId)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: '#888', py: 4 }}>No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Modal for Add/Edit */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required fullWidth size="small" />
              <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required fullWidth size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth size="small" />
              <TextField label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} fullWidth size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Gender" name="gender" value={form.gender} onChange={handleChange} fullWidth size="small" />
              <TextField label="Address" name="address" value={form.address} onChange={handleChange} fullWidth size="small" />
            </Box>
            <TextField label="Emergency Contact" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} fullWidth size="small" />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select name="role" value={form.role} onChange={handleChange} label="Role">
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="coach">Coach</MenuItem>
                  {!isNativeApp && <MenuItem value="admin">Admin</MenuItem>}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Subscription</InputLabel>
                <Select name="subscriptionStatus" value={form.subscriptionStatus} onChange={handleChange} label="Subscription">
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControlLabel control={<Checkbox name="isActive" checked={form.isActive} onChange={handleChange} />} label="Active" />
            <TextField label="Level" name="level" type="number" value={form.level} onChange={handleChange} fullWidth size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog?.open} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => confirmDialog?.action()} color="inherit">Confirm</Button>
          <Button onClick={() => setConfirmDialog(null)} color="inherit">Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for undo */}
      <Snackbar open={undoOpen} autoHideDuration={6000} onClose={() => setUndoOpen(false)} message="Action undone" />
    </Box>
  );
};

export default UsersTab; 