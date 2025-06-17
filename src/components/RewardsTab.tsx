import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Reward {
  _id: Id<"rewards">;
  name: string;
  type: "milestone" | "scratch_card";
  points: number;
  description: string;
  isActive: boolean;
  _creationTime: number;
}

export default function RewardsTab() {
  const rewards = useQuery(api.rewards.listRewards) as Reward[] || [];
  const createReward = useMutation(api.rewards.createReward);
  const updateReward = useMutation(api.rewards.updateReward);
  const deleteReward = useMutation(api.rewards.deleteReward);

  const [modalOpen, setModalOpen] = useState(false);
  const [editReward, setEditReward] = useState<Reward | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "milestone" as "milestone" | "scratch_card",
    points: 0,
    description: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openAddModal = () => {
    setEditReward(null);
    setForm({ name: "", type: "milestone", points: 0, description: "", isActive: true });
    setModalOpen(true);
  };
  const openEditModal = (reward: Reward) => {
    setEditReward(reward);
    setForm({
      name: reward.name,
      type: reward.type,
      points: reward.points,
      description: reward.description,
      isActive: reward.isActive,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, [name]: checked }));
  };
  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (form.points < 0) {
      setError("Points must be 0 or greater");
      return false;
    }
    return true;
  };
  const isFormValid = form.name.trim() && form.description.trim() && form.points >= 0;
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      if (editReward) {
        await updateReward({
          rewardId: editReward._id,
          ...form,
        });
      } else {
        await createReward({
          name: form.name,
          type: form.type,
          points: form.points,
          description: form.description,
          isActive: form.isActive,
        });
      }
      closeModal();
    } catch (err) {
      setError("Failed to save reward");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (rewardId: Id<"rewards">) => {
    if (!window.confirm("Are you sure you want to delete this reward? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteReward({ rewardId });
    } catch (err) {
      setError("Failed to delete reward");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🏆 Rewards</h2>
        <button
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          onClick={openAddModal}
        >
          + Add Reward
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Points</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rewards.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No rewards found. Click "Add Reward" to create one.
                </td>
              </tr>
            ) : (
              rewards.map((reward) => (
                <tr key={reward._id} className="border-b border-border hover:bg-muted transition">
                  <td className="p-3 font-medium">{reward.name}</td>
                  <td className="p-3 capitalize">{reward.type.replace("_", " ")}</td>
                  <td className="p-3">{reward.points}</td>
                  <td className="p-3 max-w-xs truncate">{reward.description}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={reward.isActive}
                      readOnly
                      className="text-primary"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="admin-button-secondary text-primary hover:text-white"
                        onClick={() => openEditModal(reward)}
                        title="Edit Reward"
                      >
                        Edit
                      </button>
                      <button
                        className="admin-button-secondary text-primary hover:text-white"
                        onClick={() => handleDelete(reward._id)}
                        title="Delete Reward"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Add/Edit Reward Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-lg">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-2xl font-bold mb-2 text-center">
                {editReward ? "Edit Reward" : "Add New Reward"}
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Reward Name <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    placeholder="e.g. 100 Points Milestone"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Type <span className="text-red-500">*</span></label>
                  <select
                    className="admin-input"
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="milestone">Milestone</option>
                    <option value="scratch_card">Scratch Card</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Points <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    placeholder="e.g. 100"
                    name="points"
                    type="number"
                    min={0}
                    value={form.points}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Description <span className="text-red-500">*</span></label>
                  <textarea
                    className="admin-input"
                    placeholder="Describe the reward..."
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleCheckboxChange}
                    className="text-primary"
                  />
                  <span className="text-sm">Active</span>
                </div>
                {/* Error Message */}
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                {/* Actions */}
                <div className="sticky bottom-0 left-0 right-0 bg-card flex justify-end gap-2 pt-4 border-t border-border -mx-6 px-6 pb-2">
                  <button type="button" className="admin-button-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="admin-button-primary" disabled={loading || !isFormValid}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 