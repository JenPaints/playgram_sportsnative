import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { toast } from "sonner";
import { useState } from "react";
import { SpotlightCard } from '../ui/SpotlightCard';
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";
import { Dumbbell, ArrowRight, Users, Clock, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export function SportsGrid() {
  const sports = useQuery(api.sports.getActiveSports);
  const [selectedSport, setSelectedSport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
        {sports?.map((sport) => (
          <motion.div
            key={sport._id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            whileHover={{ scale: 1.04, boxShadow: "0 0 32px #818cf8" }}
            className="relative bg-gradient-to-br from-indigo-700/80 via-purple-700/70 to-pink-600/70 rounded-3xl p-6 shadow-2xl border border-indigo-400 flex flex-col items-center overflow-hidden group"
          >
            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg border-4 border-white/20 bg-gray-900 mb-4">
              <img 
                src={sport.imageUrl || `/images/sports/${sport.name?.toLowerCase() || 'default'}.jpg`} 
                alt={sport.name} 
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/sports/default.jpg';
                }}
              />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
              <Dumbbell className="text-indigo-300" size={22} /> {sport.name}
            </h3>
            <p className="text-indigo-100 text-center mb-4 line-clamp-3 min-h-[60px]">{sport.description}</p>
            <motion.button
              whileHover={{ scale: 1.08, boxShadow: "0 0 16px #f472b6" }}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg text-lg hover:from-pink-600 hover:to-indigo-600 transition flex items-center gap-2 mt-auto"
              onClick={() => setSelectedSport(sport)}
            >
              Subscribe <ArrowRight size={18} />
            </motion.button>
            {/* Animated background shapes */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-pink-400/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
      {selectedSport && (
        <SportDetailsModal
          sport={selectedSport}
          onClose={() => setSelectedSport(null)}
        />
      )}
      </AnimatePresence>
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
      if (error.message && error.message.includes("Already enrolled in this batch")) {
        toast.error("You are already enrolled in this batch.");
      } else {
        toast.error(error.message || "Failed to apply");
      }
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
                          <div className="space-y-1 mt-2">
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                              <Calendar size={16} />
                            {batch.schedule.days.join(", ")} • {batch.schedule.startTime} - {batch.schedule.endTime}
                          </p>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                              <MapPin size={16} />
                              {batch.venue}
                            </p>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                              <Users size={16} />
                              {batch.level} • {batch.ageGroup}
                          </p>
                          </div>
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
        image: "/logo.png",
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
    } catch (error: any) {
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Subscribe to {sport.name}</h3>
        <div className="space-y-4">
          <div className="bg-gray-700/50 p-4 rounded-xl">
            <div className="text-sm text-gray-400">Selected Batch</div>
            <div className="text-white font-semibold">{batch.name}</div>
            <div className="text-sm text-gray-400 mt-1">
              {batch.schedule.days.join(", ")} • {batch.schedule.startTime} - {batch.schedule.endTime}
            </div>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-xl">
            <div className="text-sm text-gray-400">Monthly Fee</div>
            <div className="text-2xl font-bold text-green-400">₹{sport.pricePerMonth}</div>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </button>
      </div>
      </motion.div>
    </motion.div>
  );
}
