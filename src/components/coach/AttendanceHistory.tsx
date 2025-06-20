import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useState } from "react";

export function AttendanceHistory() {
  const batches = useQuery(api.batches.getCoachBatches);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const attendance = useQuery(
    api.attendance.getBatchAttendance,
    selectedBatch ? { batchId: selectedBatch as any, date: selectedDate } : "skip"
  );

  if (batches === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Attendance History</h2>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} - {batch.sport?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Attendance Records */}
      {selectedBatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Attendance for {selectedDate}
            </h3>
            {attendance && (
              <p className="text-gray-400 text-sm mt-1">
                {attendance.length} student{attendance.length !== 1 ? 's' : ''} marked present
              </p>
            )}
          </div>

          {attendance === undefined ? (
            <div className="p-6 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-lg font-semibold text-white mb-2">No Attendance Records</h4>
              <p className="text-gray-400">
                No attendance has been marked for this batch on {selectedDate}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {attendance.map((record, index) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        record.isPresent ? "bg-green-500" : "bg-red-500"
                      }`} />
                      
                      <div>
                        <div className="font-semibold text-white">
                          {record.student.profile?.firstName} {record.student.profile?.lastName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {record.student.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        via {record.method}
                      </div>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="mt-2 text-sm text-gray-400 ml-7">
                      Note: {record.notes}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
