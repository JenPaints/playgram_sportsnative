import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript";

interface Product {
  _id: Id<"products">;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
}

export default function MerchandiseTab() {
  const products = (useQuery(api.products.listProducts) as Product[] || []).filter(
    (p) => p.isActive && p.stock > 0
  );
  const createOrder = useMutation(api.products.createOrder);
  const createRazorpayOrder = useAction(api.razorpay.createRazorpayOrder);
  const verifyRazorpayPayment = useAction(api.razorpay.verifyRazorpayPayment);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPickup, setShowPickup] = useState(false);
  const [pickupInfo, setPickupInfo] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Fetch student's own orders (optional, for status display)
  const myOrders = useQuery(api.products.listOrders, { userId: undefined });

  const handleBuy = async (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const amount = Number(selectedProduct.price) * Number(quantity);
      // 1. Create Razorpay order
      const shortReceipt = `m_${selectedProduct._id.slice(0, 10)}_${Date.now()}`.slice(0, 40);
      const order = await createRazorpayOrder({
        amount: amount * 100, // paise, number
        currency: "INR",
        receipt: shortReceipt,
      });
      // 2. Load Razorpay script
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay SDK not loaded");
      // 3. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: Number(order.amount),
        currency: order.currency,
        name: "PlayGram Sports",
        description: `Purchase: ${selectedProduct.name}`,
        order_id: order.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }) => {
          try {
            // 4. Verify payment
            const verification = await verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verification.verified) throw new Error("Payment verification failed");
            // 5. Create order in DB
            const orderId = await createOrder({
              productId: selectedProduct._id,
              quantity,
              amount,
              paymentId: undefined, // Optionally link payment if tracked
              pickupSession: undefined, // To be set by admin or logic
            });
            setShowPickup(true);
            setPickupInfo("Please pick up your merchandise at your next session. (This can be customized.)");
            toast.success("Purchase successful!");
            setSelectedProduct(null);
            setQuantity(1);
          } catch (err) {
            toast.error("Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {},
        theme: { color: "#3b82f6" },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error("Purchase failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">🛍️ Merchandise</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-gray-900 rounded-xl p-6 flex flex-col items-center shadow w-full">
            {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover rounded mb-4" />}
            <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
            <p className="text-gray-300 mb-2">{product.description}</p>
            <div className="text-orange-400 font-bold mb-2">₹{product.price}</div>
            <div className="text-gray-400 mb-2">Stock: {product.stock}</div>
            <button
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
              onClick={() => handleBuy(product)}
              disabled={loading}
            >
              Buy
            </button>
          </div>
        ))}
      </div>
      {/* Purchase Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-4 sm:p-8 w-full max-w-md space-y-4 border border-gray-700 shadow-xl animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-2">Buy {selectedProduct.name}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <label className="text-gray-300">Quantity:</label>
              <input
                type="number"
                min={1}
                max={selectedProduct.stock}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Math.min(selectedProduct.stock, Number(e.target.value))))}
                className="w-20 p-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="text-orange-400 font-bold mb-4">Total: ₹{selectedProduct.price * quantity}</div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex-1"
              >
                {loading ? "Processing..." : "Pay & Buy"}
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full sm:w-auto bg-gray-700 text-white px-4 py-2 rounded-xl font-semibold flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pickup Popup */}
      {showPickup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-md space-y-4 border border-gray-700 shadow-xl animate-fadeIn text-center">
            <h3 className="text-xl font-bold text-green-700 mb-2">Purchase Successful!</h3>
            <div className="text-gray-800 mb-4">{pickupInfo}</div>
            <button
              onClick={() => setShowPickup(false)}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* My Orders (optional) */}
      {myOrders && myOrders.length > 0 && (
        <div className="mt-10 overflow-x-auto">
          <h3 className="text-lg font-bold text-white mb-2">My Merchandise Orders</h3>
          <table className="min-w-[500px] bg-gray-900 rounded-xl">
            <thead>
              <tr className="text-gray-400">
                <th className="p-3">Product</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Pickup</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((order: any) => (
                <tr key={order._id} className="border-b border-gray-800">
                  <td className="p-3 text-white">{order.productId}</td>
                  <td className="p-3 text-white">{order.quantity}</td>
                  <td className="p-3 text-orange-400">₹{order.amount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === "completed" ? "bg-green-700 text-green-300" : order.status === "paid" ? "bg-blue-700 text-blue-300" : "bg-yellow-700 text-yellow-300"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-white">{order.pickupSession || "TBD"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 