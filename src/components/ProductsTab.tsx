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

// Define Product type for type safety
interface Product {
  _id: Id<"products">;
  _creationTime: number;
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

  const openAddModal = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: 0, imageUrl: "", stock: 0, isActive: true });
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
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editProduct) {
        await updateProduct({
          productId: editProduct._id,
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        });
      } else {
        await createProduct({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        });
      }
      closeModal();
    } catch (err) {
      setError("Failed to save product");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (productId: Id<"products">) => {
    if (!window.confirm("Delete this product?")) return;
    setLoading(true);
    try {
      await deleteProduct({ productId });
    } catch (err) {
      setError("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>🛒 Products</Typography>
        <Button variant="contained" color="primary" onClick={openAddModal}>+ Add Product</Button>
      </Box>
      <TableContainer component={Paper} sx={{ background: '#18181b', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id} hover>
                <TableCell>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <Typography color="text.secondary">No image</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{product.name}</TableCell>
                <TableCell sx={{ color: '#bbb' }}>{product.description}</TableCell>
                <TableCell sx={{ color: '#ff9800', fontWeight: 700 }}>₹{product.price}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{product.stock}</TableCell>
                <TableCell>
                  <Box sx={{ px: 1, py: 0.5, borderRadius: 1, fontWeight: 700, fontSize: 12, background: product.isActive ? '#166534' : '#374151', color: product.isActive ? '#bbf7d0' : '#d1d5db', display: 'inline-block' }}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button size="small" variant="contained" color="info" sx={{ mr: 1 }} onClick={() => openEditModal(product)}>Edit</Button>
                  <Button size="small" variant="contained" color="error" onClick={() => handleDelete(product._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: '#888', py: 4 }}>No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Modal for Add/Edit */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column' }}>
          <DialogContent>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth size="small" />
              <TextField label="Description" name="description" value={form.description} onChange={handleChange} required fullWidth size="small" multiline rows={2} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} required fullWidth size="small" />
                <TextField label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} required fullWidth size="small" />
              </Box>
              <TextField label="Image URL" name="imageUrl" value={form.imageUrl} onChange={handleChange} fullWidth size="small" />
              <FormControlLabel control={<Checkbox name="isActive" checked={form.isActive} onChange={handleChange} />} label="Active" />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
} 