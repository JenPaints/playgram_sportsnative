import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import Tilt from 'react-parallax-tilt';
import { api } from "../../../convex/_generated/api";

interface Payment {
  _id: Id<"payments">;
  userId: Id<"users">;
  enrollmentId: Id<"enrollments">;
  amount: number;
  status: "pending" | "completed" | "failed" | "attempted";
  method: string;
  transactionId?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  paymentDate?: number;
  receiptNumber?: string;
  paymentPeriod?: string;
  refunded?: boolean;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: number;
  enrollment: {
    sportId: Id<"sports">;
    batchId: Id<"batches">;
    sport: {
      name: string;
    };
    batch: {
      name: string;
    };
  };
}

// Utility function to truncate long IDs
function truncateId(id: string, front = 6, back = 6) {
  if (!id) return "";
  if (id.length <= front + back) return id;
  return `${id.slice(0, front)}...${id.slice(-back)}`;
}

export function Profile() {
  const profile = useQuery(api.users.getCurrentProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateInvoicePDF = useAction(api.pdf.generateInvoicePDF);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
  });
  const [downloadingId, setDownloadingId] = useState<null | string>(null);

  // Get user's payment history
  const payments = useQuery(api.payments.listPayments, {
    userId: profile?.profile?.userId,
  }) as Payment[] | undefined;

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.profile?.firstName || "",
        lastName: profile.profile?.lastName || "",
        phone: profile.profile?.phone || "",
        dateOfBirth: profile.profile?.dateOfBirth || "",
        gender: profile.profile?.gender || "",
        address: profile.profile?.address || "",
        emergencyContact: profile.profile?.emergencyContact || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case 'completed':
        return 'bg-green-700 text-green-300';
      case 'pending':
        return 'bg-yellow-700 text-yellow-300';
      case 'failed':
        return 'bg-red-700 text-red-300';
      case 'attempted':
        return 'bg-blue-700 text-blue-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const avatarSeed = profile?.profile?.firstName
    ? `${profile.profile.firstName} ${profile.profile.lastName || ""}`.trim()
    : undefined;
  const avatarUrl = avatarSeed
    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`
    : undefined;

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsEditing(!isEditing)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-8">
        {/* Profile Summary */}
        <Tilt
          glareEnable={true}
          glareMaxOpacity={0.35}
          glareColor="#60a5fa"
          glarePosition="all"
          scale={1.04}
          tiltMaxAngleX={12}
          tiltMaxAngleY={12}
          perspective={1200}
          className="rounded-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-blue-700 via-purple-700 to-black rounded-xl p-8 text-white shadow-2xl overflow-hidden border-2 border-blue-500/40"
          >
            <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-600 via-fuchsia-600 to-indigo-600 opacity-40 blur-2xl pointer-events-none" />
            <div className="relative z-10 text-center">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  width={80}
                  height={80}
                  style={{ borderRadius: '50%', boxShadow: '0 0 0 4px #1e293b' }}
                  className="mb-4 mx-auto"
                />
              )}
              <h3 className="text-2xl font-extrabold mb-1 tracking-tight drop-shadow-lg">
                {profile.profile?.firstName} {profile.profile?.lastName}
              </h3>
              <p className="text-blue-200 capitalize mb-4 text-sm font-medium tracking-wide">
                {profile.profile?.role}
              </p>
              <div className="flex justify-center gap-8 mt-4">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-extrabold text-yellow-400 drop-shadow-lg">{profile.profile?.totalPoints}</div>
                  <div className="text-xs text-blue-100">Points</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-extrabold text-blue-300 drop-shadow-lg">{profile.profile?.level}</div>
                  <div className="text-xs text-blue-100">Level</div>
                </div>
              </div>
            </div>
          </motion.div>
        </Tilt>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-700 rounded-xl text-white">
                    {profile.profile?.firstName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-700 rounded-xl text-white">
                    {profile.profile?.lastName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-700 rounded-xl text-white">
                    {profile.phone || "Not provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-700 rounded-xl text-white">
                    {profile.profile?.dateOfBirth || "Not provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-700 rounded-xl text-white capitalize">
                    {profile.profile?.gender || "Not provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Student ID
                </label>
                <div className="mt-2 text-center">
                  <div className="font-mono text-xs bg-gray-800 rounded px-2 py-1 max-w-xs inline-block" title={profile.profile?.userId}>
                    Student ID: {truncateId(profile.profile?.userId)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session ID
                </label>
                <div className="mt-2 text-center">
                  <div className="font-mono text-xs bg-gray-800 rounded px-2 py-1 max-w-xs inline-block mt-1" title={profile.profile?.sessionId}>
                    Session: {truncateId(profile.profile?.sessionId)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-700 rounded-xl text-white min-h-[80px]">
                  {profile.profile?.address || "Not provided"}
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Emergency Contact
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Name and phone number"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-700 rounded-xl text-white">
                  {profile.profile?.emergencyContact || "Not provided"}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mt-6 flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Payment History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Payment History</h3>
        <div className="overflow-x-auto">
          {!payments ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No payment history found.
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Sport/Batch</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 text-gray-300">{formatDate(payment.createdAt)}</td>
                    <td className="p-3">
                      <div className="text-gray-300">
                        <div>{payment.enrollment.sport.name}</div>
                        <div className="text-sm text-gray-400">{payment.enrollment.batch.name}</div>
                      </div>
                    </td>
                    <td className="p-3 text-orange-400 font-bold">{formatAmount(payment.amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                      {payment.refunded && (
                        <div className="text-xs text-red-400 mt-1">Refunded</div>
                      )}
                    </td>
                    <td className="p-3 text-gray-300 capitalize">{payment.method}</td>
                    <td className="p-3">
                      {payment.receiptNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-mono text-sm">{payment.receiptNumber}</span>
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                            disabled={downloadingId === payment._id}
                            onClick={async () => {
                              setDownloadingId(payment._id);
                              try {
                                const { url } = await generateInvoicePDF({ invoiceId: payment._id });
                                if (typeof url === 'string') {
                                  window.open(url, '_blank');
                                }
                              } catch (err) {
                                toast.error('Failed to download receipt');
                              } finally {
                                setDownloadingId(null);
                              }
                            }}
                          >
                            {downloadingId === payment._id ? <LoadingSpinner size="sm" /> : "Download"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
