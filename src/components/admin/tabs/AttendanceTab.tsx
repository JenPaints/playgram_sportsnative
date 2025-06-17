import { useState, useEffect } from "react";
import { useQuery } from "convex/react";

export default function AttendanceTab() {
  const [batchId, setBatchId] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pollInterval, setPollInterval] = useState(10000); // 10s

  // Fetch attendance records with filters
  // @ts-expect-error
  const attendance = useQuery("attendance:listAttendance", {
    batchId: batchId || undefined,
    userId: userId || undefined,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
  });

  // Fetch batches and users for filter dropdowns
  // @ts-expect-error
  const batches = useQuery("batches:getAllBatches", {});
  // @ts-expect-error
  const users = useQuery("users:getAllUsers", {});

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger a re-render and refetch
      setPollInterval((i) => i + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Attendance Records</h2>
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium">Batch</label>
          <select
            className="border rounded px-2 py-1"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          >
            <option value="">All</option>
            {batches?.map((batch: any) => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Student</label>
          <select
            className="border rounded px-2 py-1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">All</option>
            {users?.map((user: any) => (
              <option key={user._id} value={user._id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Student</th>
              <th className="border px-2 py-1">Batch</th>
              <th className="border px-2 py-1">Sport</th>
              <th className="border px-2 py-1">Present</th>
              <th className="border px-2 py-1">Method</th>
              <th className="border px-2 py-1">Notes</th>
            </tr>
          </thead>
          <tbody>
            {attendance?.map((record: any) => (
              <tr key={record._id}>
                <td className="border px-2 py-1">{record.date}</td>
                <td className="border px-2 py-1">{record.user?.name || record.userId}</td>
                <td className="border px-2 py-1">{record.batch?.name || record.batchId}</td>
                <td className="border px-2 py-1">{record.sport?.name || "-"}</td>
                <td className="border px-2 py-1">{record.isPresent ? "Yes" : "No"}</td>
                <td className="border px-2 py-1">{record.method}</td>
                <td className="border px-2 py-1">{record.notes || ""}</td>
              </tr>
            ))}
            {attendance?.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 