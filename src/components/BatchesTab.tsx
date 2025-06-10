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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
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
      await assignCoach({ batchId, coachId: coachId as Id<"users"> });
    } catch (err) {
      setError("Failed to assign coach");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">🏫 Batches</h2>
        <button
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          onClick={openAddModal}
        >
          + Add Batch
        </button>
      </div>
      <div className="overflow-x-auto">
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>Coach</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <TableCell className="p-3 text-white font-semibold">{batch.name}</TableCell>
                  <TableCell className="p-3 text-gray-300">{batch.sport?.name}</TableCell>
                  <TableCell className="p-3">
                    <Select
                      value={batch.coachId || ""}
                      onChange={(e) => handleAssignCoach(batch._id, e.target.value as string)}
                      className="bg-gray-800 text-white rounded px-2 py-1"
                    >
                      <MenuItem value="">Select Coach</MenuItem>
                      {coaches.map((coach: any) => (
                        <MenuItem key={coach.userId} value={coach.userId}>
                          {coach.firstName} {coach.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell className="p-3 text-white">{batch.students.length}</TableCell>
                  <TableCell className="p-3 text-gray-300">
                    {batch.schedule.days.join(", ")}<br />
                    {batch.schedule.startTime} - {batch.schedule.endTime}
                  </TableCell>
                  <TableCell className="p-3 text-white">{batch.venue}</TableCell>
                  <TableCell className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${batch.isActive ? "bg-green-700 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                      {batch.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 flex gap-2">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => openEditModal(batch)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(batch._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">No batches found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      {/* Modal for Add/Edit */}
      {modalOpen && (
        <Dialog open={modalOpen} onClose={closeModal} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Box className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl space-y-4 border border-gray-700 shadow-xl animate-fadeIn">
            <DialogTitle className="text-xl font-bold text-white mb-2">{editBatch ? "Edit Batch" : "Add Batch"}</DialogTitle>
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Name</label>
                  <TextField name="name" value={form.name} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Sport</label>
                  <Select name="sportId" value={form.sportId} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white">
                    <MenuItem value="">Select Sport</MenuItem>
                    {sports.map((sport: any) => (
                      <MenuItem key={sport._id} value={sport._id}>{sport.name}</MenuItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Coach (Optional)</label>
                  <Select name="coachId" value={form.coachId} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white">
                    <MenuItem value="">Select Coach</MenuItem>
                    {coaches.map((coach: any) => (
                      <MenuItem key={coach.userId} value={coach.userId}>{coach.firstName} {coach.lastName}</MenuItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Max Students</label>
                  <TextField name="maxStudents" type="number" value={form.maxStudents} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Start Time</label>
                  <TextField name="startTime" type="time" value={form.startTime} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">End Time</label>
                  <TextField name="endTime" type="time" value={form.endTime} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Age Group</label>
                  <TextField name="ageGroup" value={form.ageGroup} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Level</label>
                  <Select name="level" value={form.level} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white">
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Venue</label>
                <TextField name="venue" value={form.venue} onChange={handleChange} required className="w-full p-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Schedule Days</label>
                <div className="grid grid-cols-4 gap-2">
                  {weekDays.map(day => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={form.days.includes(day)}
                          onChange={(e) => handleDayToggle(day)}
                        />
                      }
                      label={day.slice(0, 3)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FormControlLabel
                  control={<Checkbox name="isActive" checked={form.isActive} onChange={handleChange} />}
                  label="Active"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="contained"
                  color="primary"
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition flex-1"
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="contained"
                  color="secondary"
                  className="bg-gray-700 text-white px-4 py-2 rounded-xl font-semibold flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Box>
        </Dialog>
      )}
    </div>
  );
} 