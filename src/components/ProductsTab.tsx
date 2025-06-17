import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Product {
  _id: Id<"products">;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
}

export default function ProductsTab() {
  const products = useQuery(api.products.listProducts) as Product[] || [];
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);

  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    stock: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const openAddModal = () => {
    setEditProduct(null);
    setForm({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      stock: 0,
      isActive: true,
    });
    setImagePreview("");
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl || "",
      stock: product.stock,
      isActive: product.isActive,
    });
    setImagePreview(product.imageUrl || "");
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

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (form.price <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    if (form.stock < 0) {
      setError("Stock cannot be negative");
      return false;
    }
    return true;
  };

  const isFormValid =
    form.name.trim() &&
    form.description.trim() &&
    form.price > 0 &&
    form.stock >= 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      // TODO: Implement image upload to storage
      // For now, we'll just use the image preview URL
      const formData = {
        ...form,
        imageUrl: imagePreview || form.imageUrl,
      };
      if (editProduct) {
        await updateProduct({
          productId: editProduct._id,
          ...formData,
        });
      } else {
        await createProduct({
          name: form.name,
          description: form.description,
          price: form.price,
          stock: form.stock,
          isActive: form.isActive,
        });
      }
      closeModal();
    } catch {
      setError("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: Id<"products">) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteProduct({ productId });
    } catch {
      setError("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  if (!products) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🛒 Products</h2>
        <button
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          onClick={openAddModal}
        >
          + Add Product
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
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) :
              products.map((product, idx) => (
                <tr
                  key={product._id}
                  className={`border-b border-border transition ${idx % 2 === 0 ? 'bg-card' : 'bg-[#23232a]'} hover:bg-muted`}
                >
                  <td className="p-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        🛒
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 max-w-xs truncate">{product.description}</td>
                  <td className="p-3">₹{product.price}</td>
                  <td className="p-3">{product.stock}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={product.isActive}
                      readOnly
                      className="text-primary"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="admin-button-secondary text-primary hover:text-white"
                        onClick={() => openEditModal(product)}
                        title="Edit Product"
                      >
                        Edit
                      </button>
                      <button
                        className="admin-button-secondary text-primary hover:text-white"
                        onClick={() => void handleDelete(product._id)}
                        title="Delete Product"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Add/Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-lg">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-2xl font-bold mb-2 text-center">
                {editProduct ? "Edit Product" : "Add New Product"}
              </div>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Product Image URL</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🛒</span>
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
                  <label className="block text-sm font-medium">Product Name <span className="text-red-500">*</span></label>
                  <input
                    className="admin-input"
                    placeholder="e.g. Football Jersey"
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
                    placeholder="Describe the product, e.g. 'High-quality football jersey for all ages.'"
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
                    <label className="block text-sm font-medium">Price (₹) <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      placeholder="e.g. 499"
                      name="price"
                      type="number"
                      min={1}
                      value={form.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Stock <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      placeholder="e.g. 100"
                      name="stock"
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={handleInputChange}
                      required
                    />
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