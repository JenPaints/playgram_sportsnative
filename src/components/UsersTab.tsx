import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, ChangeEvent } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-hot-toast';
import { UserPlus, Edit2, Trash2, UserCog } from 'lucide-react';

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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name as string]: type === 'checkbox' ? checked : value
    }));
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

  const handleRoleUpdate = (profileId: Id<"profiles">, role: "student" | "coach" | "admin") => {
    updateUserRole({ profileId, role });
  };

  const handleSubscriptionUpdate = (profileId: Id<"profiles">, status: "active" | "pending" | "expired") => {
    updateSubscriptionStatus({ profileId, status });
  };

  const handleDeleteUser = (profileId: Id<"profiles">) => {
    setConfirmDialog({
      open: true,
      message: "Are you sure you want to delete this user?",
      action: () => {
        deleteUser({ profileId });
        setUndoOpen(true);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-foreground font-semibold flex items-center gap-2 text-xl">
          <UserCog className="w-6 h-6" />
          Users Management
        </div>
        <button
          className="admin-button-primary flex items-center gap-2"
          onClick={openAddModal}
        >
          <UserPlus className="w-5 h-5" /> Add User
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Subscription</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Level</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user._id}
                className={`border-b border-border transition ${idx % 2 === 0 ? 'bg-card' : 'bg-[#23232a]'} hover:bg-muted`}
              >
                <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                <td className="p-3">
                  <select
                        value={user.role}
                    onChange={(e) => handleRoleUpdate(user._id, e.target.value as "student" | "coach" | "admin")}
                    className="admin-input"
                  >
                    <option value="student">Student</option>
                    <option value="coach">Coach</option>
                    {!isNativeApp && <option value="admin">Admin</option>}
                  </select>
                </td>
                <td className="p-3 text-muted-foreground">{user.phone}</td>
                <td className="p-3">
                  <select
                      value={user.subscriptionStatus}
                    onChange={(e) => handleSubscriptionUpdate(user._id, e.target.value as "active" | "pending" | "expired")}
                    className="admin-input"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={user.isActive}
                    onChange={(e) => handleChange({ target: { name: 'isActive', type: 'checkbox', checked: e.target.checked } } as any)}
                    className="text-primary"
                  />
                </td>
                <td className="p-3">{user.level}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => openEditModal(user)}
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => handleDeleteUser(user._id)}
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="text-lg font-semibold mb-4">{editUser ? 'Edit User' : 'Add New User'}</div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="admin-input"
                  placeholder="First Name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
                <input
                  className="admin-input"
                  placeholder="Last Name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <input
                className="admin-input"
                placeholder="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
              <input
                className="admin-input"
                placeholder="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
              <select
                className="admin-input"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                className="admin-input"
                placeholder="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
              <input
                className="admin-input"
                placeholder="Emergency Contact"
                name="emergencyContact"
                value={form.emergencyContact}
                onChange={handleChange}
              />
              <select
                className="admin-input"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="coach">Coach</option>
                {!isNativeApp && <option value="admin">Admin</option>}
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="text-primary"
                />
                Active
              </label>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button type="button" className="admin-button-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-button-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-6 w-full max-w-sm">
            <div className="text-lg font-semibold mb-4">Confirm Action</div>
            <div className="mb-4">{confirmDialog.message}</div>
            <div className="flex justify-end gap-2">
              <button className="admin-button-secondary" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="admin-button-primary" onClick={() => { confirmDialog.action(); setConfirmDialog(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Snackbar */}
      {undoOpen && (
        <div className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-lg shadow p-4 flex items-center gap-4">
          <span>User deleted</span>
          <button
            className="admin-button-primary"
            onClick={() => { undoAction?.(); setUndoOpen(false); }}
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersTab; 