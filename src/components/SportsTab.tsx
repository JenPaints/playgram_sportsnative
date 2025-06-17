import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Sport {
  _id: Id<"sports">;
  name: string;
  description: string;
  isActive: boolean;
  maxStudentsPerBatch: number;
  pricePerMonth: number;
  equipment: string[];
  ageGroups: string[];
  imageUrl?: string;
  razorpayPlanId?: string;
}

export default function SportsTab() {
  const sports = useQuery(api.sports.getAllSports) as Sport[] || [];
  const createSport = useMutation(api.sports.createSport);
  const updateSport = useMutation(api.sports.updateSport);
  const deleteSport = useMutation(api.sports.deleteSport);

  const [modalOpen, setModalOpen] = useState(false);
  const [editSport, setEditSport] = useState<Sport | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    maxStudentsPerBatch: 0,
    pricePerMonth: 0,
    equipment: [] as string[],
    ageGroups: [] as string[],
    imageUrl: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [newAgeGroup, setNewAgeGroup] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const openAddModal = () => {
    setEditSport(null);
    setForm({
      name: "",
      description: "",
      maxStudentsPerBatch: 0,
      pricePerMonth: 0,
      equipment: [],
      ageGroups: [],
      imageUrl: "",
      isActive: true,
    });
    setImagePreview("");
    setModalOpen(true);
  };

  const openEditModal = (sport: Sport) => {
    setEditSport(sport);
    setForm({
      name: sport.name,
      description: sport.description,
      maxStudentsPerBatch: sport.maxStudentsPerBatch,
      pricePerMonth: sport.pricePerMonth,
      equipment: sport.equipment,
      ageGroups: sport.ageGroups,
      imageUrl: sport.imageUrl || "",
      isActive: sport.isActive,
    });
    setImagePreview(sport.imageUrl || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError("");
    setImagePreview("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === "imageUrl") {
      setImagePreview(value);
    }
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, [name]: checked }));
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      if (form.equipment.includes(newEquipment.trim())) {
        setError("Equipment already exists");
        return;
      }
      setForm((f) => ({ ...f, equipment: [...f.equipment, newEquipment.trim()] }));
      setNewEquipment("");
    }
  };

  const removeEquipment = (index: number) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.filter((_, i) => i !== index),
    }));
  };

  const addAgeGroup = () => {
    if (newAgeGroup.trim()) {
      if (form.ageGroups.includes(newAgeGroup.trim())) {
        setError("Age group already exists");
        return;
      }
      setForm((f) => ({ ...f, ageGroups: [...f.ageGroups, newAgeGroup.trim()] }));
      setNewAgeGroup("");
    }
  };

  const removeAgeGroup = (index: number) => {
    setForm((f) => ({
      ...f,
      ageGroups: f.ageGroups.filter((_, i) => i !== index),
    }));
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
    if (form.maxStudentsPerBatch <= 0) {
      setError("Max students must be greater than 0");
      return false;
    }
    if (form.pricePerMonth <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    if (form.equipment.length === 0) {
      setError("At least one equipment is required");
      return false;
    }
    if (form.ageGroups.length === 0) {
      setError("At least one age group is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      const formData = {
        ...form,
        imageUrl: imagePreview || form.imageUrl,
      };

      if (editSport) {
        await updateSport({
          sportId: editSport._id,
          ...formData,
        });
      } else {
        await createSport({
          name: form.name,
          description: form.description,
          maxStudentsPerBatch: form.maxStudentsPerBatch,
          pricePerMonth: form.pricePerMonth,
          equipment: form.equipment,
          ageGroups: form.ageGroups,
        });
      }
      closeModal();
    } catch (err) {
      setError("Failed to save sport");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sportId: Id<"sports">) => {
    if (!window.confirm("Are you sure you want to delete this sport? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteSport({ sportId });
    } catch (err) {
      setError("Failed to delete sport");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.name.trim() &&
    form.description.trim() &&
    form.maxStudentsPerBatch > 0 &&
    form.pricePerMonth > 0 &&
    form.equipment.length > 0 &&
    form.ageGroups.length > 0;

  if (!sports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🏃 Sports</h2>
        <button
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          onClick={openAddModal}
        >
          + Add Sport
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Max Students</th>
              <th className="p-3 text-left">Price/Month</th>
              <th className="p-3 text-left">Equipment</th>
              <th className="p-3 text-left">Age Groups</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sports.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No sports found. Click "Add Sport" to create one.
                </td>
              </tr>
            ) : (
              sports.map((sport) => (
                <tr key={sport._id} className="border-b border-border hover:bg-muted transition">
                  <td className="p-3">
                    {sport.imageUrl ? (
                      <img
                        src={sport.imageUrl}
                        alt={sport.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        🏃
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{sport.name}</td>
                  <td className="p-3 max-w-xs truncate">{sport.description}</td>
                  <td className="p-3">{sport.maxStudentsPerBatch}</td>
                  <td className="p-3">₹{sport.pricePerMonth}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {sport.equipment.map((item, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {sport.ageGroups.map((group, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={sport.isActive}
                      readOnly
                      className="text-primary"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="admin-button-secondary text-primary hover:text-white"
                        onClick={() => openEditModal(sport)}
                        title="Edit Sport"
                      >
                        Edit
                      </button>
                      <button
                        className="admin-button-secondary text-primary hover:text-white"
                        onClick={() => handleDelete(sport._id)}
                        title="Delete Sport"
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

      {/* Add/Edit Sport Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-lg">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-2xl font-bold mb-2 text-center">
                {editSport ? "Edit Sport" : "Add New Sport"}
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Sport Image URL</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🏃</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        name="imageUrl"
                        value={form.imageUrl}
                        onChange={handleInputChange}
                        placeholder="Enter image URL"
                        className="admin-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a valid image URL (e.g., https://example.com/image.jpg)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Sport Name <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    placeholder="e.g. Football"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Description <span className="text-red-500">*</span></label>
                  <textarea
                    className="admin-input"
                    placeholder="Describe the sport, e.g. 'Learn the basics of football, teamwork, and fitness.'"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                  />
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Max Students per Batch <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      placeholder="e.g. 20"
                      name="maxStudentsPerBatch"
                      type="number"
                      min={1}
                      value={form.maxStudentsPerBatch}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Price per Month (₹) <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      placeholder="e.g. 2000"
                      name="pricePerMonth"
                      type="number"
                      min={1}
                      value={form.pricePerMonth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Equipment <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      className="admin-input flex-1"
                      placeholder="e.g. Football, Cones, Bibs"
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={addEquipment}
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Add each equipment item separately. Example: Football, Cones, Bibs</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.equipment.map((item, index) => (
                      <span
                        key={index}
                        className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeEquipment(index)}
                          className="hover:text-red-500"
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Age Groups */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Age Groups <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      className="admin-input flex-1"
                      placeholder="e.g. 6-10, 11-15, Adults"
                      value={newAgeGroup}
                      onChange={(e) => setNewAgeGroup(e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={addAgeGroup}
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Add each age group separately. Example: 6-10, 11-15, Adults</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.ageGroups.map((group, index) => (
                      <span
                        key={index}
                        className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {group}
                        <button
                          type="button"
                          onClick={() => removeAgeGroup(index)}
                          className="hover:text-red-500"
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
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