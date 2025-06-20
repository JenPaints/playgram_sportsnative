import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, ChangeEvent } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { UserPlus, Edit2, Trash2, UserCog } from 'lucide-react';

interface CoachProfile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  role: "coach";
  sessionId: string;
  isActive: boolean;
  subscriptionStatus: "active" | "pending" | "expired";
  totalPoints: number;
  level: number;
  joinedAt: number;
}

const CoachesTab: React.FC = () => {
  const users = useQuery(api.users.getAllUsers) as CoachProfile[] || [];
  const coaches = users.filter((u) => u.role === "coach");
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);
  const deleteUser = useMutation(api.users.deleteUser);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCoach, setEditCoach] = useState<CoachProfile | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    isActive: true,
    subscriptionStatus: "active" as "active" | "pending" | "expired",
    level: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; message: string } | null>(null);

  const openAddModal = () => {
    setEditCoach(null);
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      emergencyContact: "",
      isActive: true,
      subscriptionStatus: "active",
      level: 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (coach: CoachProfile) => {
    setEditCoach(coach);
    setForm({
      firstName: coach.firstName,
      lastName: coach.lastName,
      phone: coach.phone || "",
      dateOfBirth: coach.dateOfBirth || "",
      gender: coach.gender || "",
      address: coach.address || "",
      emergencyContact: coach.emergencyContact || "",
      isActive: coach.isActive,
      subscriptionStatus: coach.subscriptionStatus,
      level: coach.level,
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
      if (editCoach) {
        await updateUser({
          profileId: editCoach._id,
          ...form,
          role: "coach",
        });
      } else {
        await createUser({ ...form, role: "coach" });
      }
      closeModal();
    } catch (err) {
      setError("Failed to save coach");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoach = (profileId: Id<"profiles">) => {
    setConfirmDialog({
      open: true,
      message: "Are you sure you want to delete this coach?",
      action: () => {
        deleteUser({ profileId });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-foreground font-semibold flex items-center gap-2 text-xl">
          <UserCog className="w-6 h-6" />
          Coaches Management
        </div>
        <button
          className="admin-button-primary flex items-center gap-2"
          onClick={openAddModal}
        >
          <UserPlus className="w-5 h-5" /> Add Coach
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Level</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((coach) => (
              <tr key={coach._id} className="border-b border-border hover:bg-muted transition">
                <td className="p-3 font-medium">{coach.firstName} {coach.lastName}</td>
                <td className="p-3 text-muted-foreground">{coach.phone}</td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={coach.isActive}
                    readOnly
                    className="text-primary"
                  />
                </td>
                <td className="p-3">{coach.level}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => openEditModal(coach)}
                      title="Edit Coach"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => handleDeleteCoach(coach._id)}
                      title="Delete Coach"
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

      {/* Add/Edit Coach Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="text-lg font-semibold mb-4">{editCoach ? 'Edit Coach' : 'Add New Coach'}</div>
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
    </div>
  );
};

export default CoachesTab; 