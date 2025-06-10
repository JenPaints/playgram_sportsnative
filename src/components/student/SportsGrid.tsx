import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { toast } from "sonner";
import { useState } from "react";
import { SpotlightCard } from '../ui/SpotlightCard';
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";

export function SportsGrid() {
  const sports = useQuery(api.sports.getActiveSports);
  const [selectedSport, setSelectedSport] = useState<any>(null);

  if (sports === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Available Sports</h2>
        <div className="text-sm text-gray-400">
          {sports.length} sports available
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map((sport, index) => (
          <motion.div
            key={sport._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedSport(sport)}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
          >
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {sport.imageUrl ? (
                <img
                  src={sport.imageUrl}
                  alt={sport.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">⚽</div>
              )}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{sport.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {sport.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price/Month:</span>
                  <span className="text-green-400 font-semibold">₹{sport.pricePerMonth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Max Students:</span>
                  <span className="text-white">{sport.maxStudentsPerBatch}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-2">Age Groups:</div>
                <div className="flex flex-wrap gap-1">
                  {sport.ageGroups.map((age: string) => (
                    <span
                      key={age}
                      className="px-2 py-1 bg-gray-700 text-xs rounded-full text-gray-300"
                    >
                      {age}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedSport && (
        <SportDetailsModal
          sport={selectedSport}
          onClose={() => setSelectedSport(null)}
        />
      )}
    </div>
  );
}

function SportDetailsModal({ sport, onClose }: { sport: any; onClose: () => void }) {
  const sportDetails = useQuery(api.sports.getSportDetails, { sportId: sport._id });
  const applyForSport = useMutation(api.sports.applyForSport);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subBatch, setSubBatch] = useState<any>(null);

  const handleApply = async () => {
    if (!selectedBatch) {
      toast.error("Please select a batch");
      return;
    }
    setIsApplying(true);
    try {
      await applyForSport({ batchId: selectedBatch._id });
      toast.success("Successfully applied for the batch!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">{sport.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <p className="text-gray-300">{sport.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-xl">
                <div className="text-sm text-gray-400">Price per Month</div>
                <div className="text-xl font-bold text-green-400">₹{sport.pricePerMonth}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-xl">
                <div className="text-sm text-gray-400">Available Batches</div>
                <div className="text-xl font-bold text-blue-400">
                  {sportDetails?.batches?.length || 0}
                </div>
              </div>
            </div>

            {sportDetails?.batches && sportDetails.batches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Available Batches</h3>
                <div className="space-y-3">
                  {sportDetails.batches.map((batch: any) => (
                    <SpotlightCard key={batch._id} className="mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{batch.name}</h4>
                          <p className="text-sm text-gray-400">
                            {batch.schedule.days.join(", ")} • {batch.schedule.startTime} - {batch.schedule.endTime}
                          </p>
                          <p className="text-sm text-gray-400">
                            {batch.level} • {batch.ageGroup} • {batch.venue}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Students</div>
                          <div className="text-white">
                            {batch.currentStudents}/{batch.maxStudents}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                          onClick={() => { setSubBatch(batch); setSubscriptionModalOpen(true); }}
                        >
                          Subscribe
                        </button>
                        <button
                          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                          onClick={() => setSelectedBatch(batch)}
                        >
                          Select
                        </button>
                      </div>
                    </SpotlightCard>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedBatch || isApplying}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isApplying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Applying...
                  </>
                ) : (
                  "Apply for Batch"
                )}
              </button>
            </div>
          </div>
        </div>
        {subscriptionModalOpen && subBatch && (
          <SubscriptionModal batch={subBatch} sport={sport} onClose={() => setSubscriptionModalOpen(false)} />
        )}
      </motion.div>
    </motion.div>
  );
}

function SubscriptionModal({ batch, sport, onClose }: { batch: any; sport: any; onClose: () => void }) {
  const createSubscription = useAction(api.razorpay_actions.createSubscription);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // 1. Call backend to create Razorpay subscription
      const result = await createSubscription({ batchId: batch._id, sportId: sport._id });
      // 2. Open Razorpay Checkout
      await loadRazorpayScript();
      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded");
        setLoading(false);
        return;
      }
      const options = {
        key: result.key,
        subscription_id: result.subscriptionId,
        name: "PlayGram",
        description: `Subscription for ${sport.name} - ${batch.name}`,
        image: "/logo.png", // Optional: your logo
        handler: function (response: any) {
          toast.success("Subscription successful!");
          onClose();
        },
        theme: { color: "#6366f1" },
        prefill: {},
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to start subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-w-md w-full p-6">
        <SpotlightCard className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Subscribe to {sport.name} - {batch.name}</h2>
          <p className="text-gray-300 mb-4">Batch: {batch.name}</p>
          <div className="mb-4">
            <span className="text-gray-400">Price per Month: </span>
            <span className="text-green-400 font-semibold">₹{sport.pricePerMonth}</span>
          </div>
          <button
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition mb-2"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay & Subscribe (Razorpay)"}
          </button>
          <button
            className="w-full py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </SpotlightCard>
      </div>
    </div>
  );
}
