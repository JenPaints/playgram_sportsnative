import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function OrdersTab() {
  // Fetch all orders
  const orders = useQuery(api.products.listOrders, {}) || [];
  // Fetch all products and users for display
  const products = useQuery(api.products.listProducts) || [];
  const users = useQuery(api.users.listUsers) || [];
  const updateOrderStatus = useMutation(api.products.updateOrderStatus);
  const [loadingOrderId, setLoadingOrderId] = useState<Id<"orders"> | null>(null);

  // Helper to get product/user info
  const getProduct = (id: Id<"products">) => products.find((p) => p._id === id);
  const getUser = (id: Id<"users">) => users.find((u) => u._id === id);

  const handleMarkCompleted = async (order: any) => {
    setLoadingOrderId(order._id);
    try {
      await updateOrderStatus({ orderId: order._id, status: "completed" });
      toast.success("Order marked as completed");
    } catch (err) {
      toast.error("Failed to update order");
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">🛒 Merchandise Orders</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 rounded-xl">
          <thead>
            <tr className="text-gray-400">
              <th className="p-3">Product</th>
              <th className="p-3">Student</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Pickup</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => {
              const product = getProduct(order.productId);
              const user = getUser(order.userId);
              const userDisplay = user
                ? user.name
                  ? user.name
                  : user.email
                    ? user.email
                    : order.userId
                : order.userId;
              return (
                <tr key={order._id} className="border-b border-gray-800">
                  <td className="p-3 text-white">{product ? product.name : order.productId}</td>
                  <td className="p-3 text-white">{userDisplay}</td>
                  <td className="p-3 text-white">{order.quantity}</td>
                  <td className="p-3 text-orange-400">₹{order.amount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === "completed" ? "bg-green-700 text-green-300" : order.status === "paid" ? "bg-blue-700 text-blue-300" : order.status === "ready_for_pickup" ? "bg-yellow-700 text-yellow-300" : "bg-gray-700 text-gray-300"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-white">{order.pickupSession || "TBD"}</td>
                  <td className="p-3 text-white">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    {order.status !== "completed" && (
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        onClick={() => handleMarkCompleted(order)}
                        disabled={loadingOrderId === order._id}
                      >
                        {loadingOrderId === order._id ? "Marking..." : "Mark Completed"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-8">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 