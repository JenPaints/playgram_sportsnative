import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Batch {
  _id: Id<"batches">;
  name: string;
  sport: { _id: Id<"sports">; name: string };
  coach?: { name: string } | null;
  coachId?: Id<"users">;
  students: any[];
  schedule: { days: string[]; startTime: string; endTime: string };
  maxStudents: number;
  currentStudents: number;
  ageGroup: string;
  level: "beginner" | "intermediate" | "advanced";
  venue: string;
  isActive: boolean;
  startDate: number;
}

export default function BatchesTab() {
  const batches = useQuery(api.batches.getAllBatches) as Batch[] || [];
  const sports = useQuery(api.sports.getAllSports) || [];
  const coaches = useQuery(api.users.getAllUsers)?.filter((u: any) => u.role === "coach") || [];
  const createBatch = useMutation(api.batches.createBatch);
  const updateBatch = useMutation(api.batches.updateBatch);
  const deleteBatch = useMutation(api.batches.deleteBatch);
  const assignCoach = useMutation(api.batches.assignCoach);

  const [modalOpen, setModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState({
    name: "",
    sportId: "",
    coachId: "",
    days: [] as string[],
    startTime: "",
    endTime: "",
    maxStudents: 0,
    ageGroup: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    venue: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const openAddModal = () => {
    setEditBatch(null);
    setForm({
      name: "",
      sportId: "",
      coachId: "",
      days: [],
      startTime: "",
      endTime: "",
      maxStudents: 0,
      ageGroup: "",
      level: "beginner",
      venue: "",
      isActive: true,
    });
    setModalOpen(true);
  };
  const openEditModal = (batch: Batch) => {
    setEditBatch(batch);
    setForm({
      name: batch.name,
      sportId: batch.sport?._id || "",
      coachId: batch.coachId || "",
      days: batch.schedule.days,
      startTime: batch.schedule.startTime,
      endTime: batch.schedule.endTime,
      maxStudents: batch.maxStudents,
      ageGroup: batch.ageGroup,
      level: batch.level,
      venue: batch.venue,
      isActive: batch.isActive,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, [name]: checked }));
  };
  const handleDayToggle = (day: string) => {
    setForm((f) =>
      f.days.includes(day)
        ? { ...f, days: f.days.filter((d) => d !== day) }
        : { ...f, days: [...f.days, day] }
    );
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const schedule = {
        days: form.days,
        startTime: form.startTime,
        endTime: form.endTime,
      };
      if (editBatch) {
        await updateBatch({
          batchId: editBatch._id,
          name: form.name,
          coachId: form.coachId ? (form.coachId as Id<"users">) : undefined,
          schedule,
          maxStudents: Number(form.maxStudents),
          ageGroup: form.ageGroup,
          level: form.level,
          venue: form.venue,
          isActive: form.isActive,
        });
      } else {
        await createBatch({
          name: form.name,
          sportId: form.sportId as Id<"sports">,
          coachId: form.coachId ? (form.coachId as Id<"users">) : undefined,
          schedule,
          maxStudents: Number(form.maxStudents),
          ageGroup: form.ageGroup,
          level: form.level,
          venue: form.venue,
        });
      }
      closeModal();
    } catch (err) {
      setError("Failed to save batch");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (batchId: Id<"batches">) => {
    if (!window.confirm("Delete this batch?")) return;
    setLoading(true);
    try {
      await deleteBatch({ batchId });
    } catch (err) {
      setError("Failed to delete batch");
    } finally {
      setLoading(false);
    }
  };
  const handleAssignCoach = async (batchId: Id<"batches">, coachId: string) => {
    setLoading(true);
    try {
      await assignCoach({ batchId, coachId: coachId ? (coachId as Id<"users">) : undefined });
    } catch (err) {
      setError("Failed to assign coach");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.name.trim() &&
    form.sportId &&
    form.days.length > 0 &&
    form.startTime &&
    form.endTime &&
    form.maxStudents > 0 &&
    form.ageGroup.trim() &&
    form.level &&
    form.venue.trim();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🏫 Batches</h2>
        <button
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          onClick={openAddModal}
        >
          + Add Batch
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Sport</th>
              <th className="p-3 text-left">Coach</th>
              <th className="p-3 text-left">Schedule</th>
              <th className="p-3 text-left">Max Students</th>
              <th className="p-3 text-left">Level</th>
              <th className="p-3 text-left">Venue</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch, idx) => (
              <tr
                key={batch._id}
                className={`border-b border-border transition ${idx % 2 === 0 ? 'bg-card' : 'bg-[#23232a]'} hover:bg-muted`}
              >
                <td className="p-3 font-medium">{batch.name}</td>
                <td className="p-3">{batch.sport?.name}</td>
                <td className="p-3">
                  <select
                    value={batch.coachId || ""}
                    onChange={(e) => handleAssignCoach(batch._id, e.target.value)}
                    className="admin-input"
                  >
                    <option value="">Unassigned</option>
                    {coaches.map((coach: any) => (
                      <option key={coach.userId} value={coach.userId}>{coach.firstName} {coach.lastName}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  {batch.schedule.days.join(", ")}<br />
                  {batch.schedule.startTime} - {batch.schedule.endTime}
                </td>
                <td className="p-3">{batch.maxStudents}</td>
                <td className="p-3 capitalize">{batch.level}</td>
                <td className="p-3">{batch.venue}</td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={batch.isActive}
                    readOnly
                    className="text-primary"
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => openEditModal(batch)}
                      title="Edit Batch"
                    >
                      Edit
                    </button>
                    <button
                      className="admin-button-secondary text-primary hover:text-white"
                      onClick={() => handleDelete(batch._id)}
                      title="Delete Batch"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Batch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-6 w-full max-w-lg">
            <div className="text-2xl font-bold mb-2 text-center">
              {editBatch ? "Edit Batch" : "Add New Batch"}
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Batch Name <span className="text-red-500">*</span></label>
                <input
                  className="admin-input"
                  placeholder="e.g. Morning Football Batch"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {/* Sport & Coach */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Select Sport <span className="text-red-500">*</span></label>
                  <select
                    className="admin-input"
                    name="sportId"
                    value={form.sportId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Sport</option>
                    {sports.map((sport: any) => (
                      <option key={sport._id} value={sport._id}>{sport.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Assign Coach</label>
                  <select
                    className="admin-input"
                    name="coachId"
                    value={form.coachId}
                    onChange={handleInputChange}
                  >
                    <option value="">Unassigned</option>
                    {coaches.map((coach: any) => (
                      <option key={coach.userId} value={coach.userId}>{coach.firstName} {coach.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Schedule */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Schedule <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {weekDays.map((day) => (
                    <label key={day} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={form.days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="accent-primary"
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Start Time <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">End Time <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              {/* Numbers & Age Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Max Students <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    type="number"
                    name="maxStudents"
                    min={1}
                    placeholder="e.g. 20"
                    value={form.maxStudents}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Age Group <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    name="ageGroup"
                    placeholder="e.g. 6-10, 11-15, Adults"
                    value={form.ageGroup}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Example: 6-10, 11-15, Adults</p>
                </div>
              </div>
              {/* Level & Venue */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Level <span className="text-red-500">*</span></label>
                  <select
                    className="admin-input"
                    name="level"
                    value={form.level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Venue <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    name="venue"
                    placeholder="e.g. Main Ground, Hall A"
                    value={form.venue}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              {/* Active Checkbox */}
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
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button type="button" className="admin-button-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-button-primary" disabled={loading || !isFormValid}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 