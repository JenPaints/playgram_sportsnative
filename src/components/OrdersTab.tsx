import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Order {
  _id: Id<"orders">;
  userId: Id<"users">;
  productId: Id<"products">;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: number;
  // Add more fields as needed
}

export default function OrdersTab() {
  const orders = useQuery(api.products.listOrders, {}) as Order[] || [];
  const users = useQuery(api.users.getAllUsers) || [];
  const products = useQuery(api.products.listProducts) || [];

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getUser = (userId: Id<"users">) => users.find((u: any) => u._id === userId);
  const getProduct = (productId: Id<"products">) => products.find((p: any) => p._id === productId);

  if (!orders) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">📦 Orders</h2>
      </div>
      <div className="overflow-x-auto rounded-xl shadow bg-card">
        <table className="min-w-full admin-table">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-b border-border hover:bg-muted transition">
                  <td className="p-3 font-mono text-xs">{order._id}</td>
                  <td className="p-3">{getUser(order.userId)?.firstName} {getUser(order.userId)?.lastName}</td>
                  <td className="p-3">{getProduct(order.productId)?.name}</td>
                  <td className="p-3">₹{order.amount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === "completed" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className="admin-button-secondary"
                      onClick={() => { setSelectedOrder(order); setDetailsOpen(true); }}
                      title="View Details"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Order Details Modal */}
      {detailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-md">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-2xl font-bold mb-4 text-center">Order Details</div>
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Order ID:</span> <span className="font-mono text-xs">{selectedOrder._id}</span>
                </div>
                <div>
                  <span className="font-semibold">User:</span> {getUser(selectedOrder.userId)?.firstName} {getUser(selectedOrder.userId)?.lastName}
                </div>
                <div>
                  <span className="font-semibold">Product:</span> {getProduct(selectedOrder.productId)?.name}
                </div>
                <div>
                  <span className="font-semibold">Amount:</span> ₹{selectedOrder.amount}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedOrder.status === "completed" ? "bg-green-100 text-green-700" : selectedOrder.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</span>
                </div>
                <div>
                  <span className="font-semibold">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="sticky bottom-0 left-0 right-0 bg-card flex justify-end gap-2 pt-4 border-t border-border -mx-6 px-6 pb-2 mt-6">
                <button type="button" className="admin-button-secondary" onClick={() => setDetailsOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 