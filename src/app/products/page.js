'use client';

import { useState, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Grid, Tooltip,
  Pagination, Avatar,
} from '@mui/material';
import {
  Search, Add, Edit, Delete, Close, CloudUpload, ImageNotSupported,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const initialProducts = [
  { id: 1,  name: 'Classic Tomato Ketchup',  category: 'Ketchup',        price: 149, stock: 50, status: 'Active',      rating: 4.8, sales: 234, image: null },
  { id: 2,  name: 'Garlic Mayonnaise',        category: 'Mayonnaise',     price: 199, stock: 30, status: 'Active',      rating: 4.6, sales: 189, image: null },
  { id: 3,  name: 'Spicy Chilli Sauce',       category: 'Hot Sauces',     price: 129, stock: 45, status: 'Active',      rating: 4.7, sales: 312, image: null },
  { id: 4,  name: 'Honey Mustard Dressing',   category: 'Salad Dressings',price: 179, stock: 25, status: 'Active',      rating: 4.5, sales: 98,  image: null },
  { id: 5,  name: 'Smoky BBQ Sauce',          category: 'Hot Sauces',     price: 159, stock: 60, status: 'Active',      rating: 4.9, sales: 445, image: null },
  { id: 6,  name: 'Eggless Mayo',             category: 'Mayonnaise',     price: 219, stock: 0,  status: 'Out of Stock',rating: 4.4, sales: 167, image: null },
  { id: 7,  name: 'Italian Herb Dressing',    category: 'Salad Dressings',price: 189, stock: 35, status: 'Active',      rating: 4.6, sales: 203, image: null },
  { id: 8,  name: 'Mango Habanero Sauce',     category: 'Hot Sauces',     price: 169, stock: 5,  status: 'Low Stock',   rating: 4.3, sales: 78,  image: null },
  { id: 9,  name: 'Mint Chutney',             category: 'Spreads',        price: 99,  stock: 40, status: 'Active',      rating: 4.7, sales: 132, image: null },
  { id: 10, name: 'Schezwan Sauce',           category: 'Hot Sauces',     price: 139, stock: 55, status: 'Active',      rating: 4.8, sales: 267, image: null },
];

const categories = ['Ketchup', 'Mayonnaise', 'Hot Sauces', 'Salad Dressings', 'Spreads'];

const statusColors = {
  'Active':       { bgcolor: '#D8F3DC', color: '#1B4332' },
  'Out of Stock': { bgcolor: '#FEE2E2', color: '#B91C1C' },
  'Low Stock':    { bgcolor: '#FEF3C7', color: '#92400E' },
  'Inactive':     { bgcolor: '#F5F5F5', color: '#57534E' },
};

const emptyForm = { name: '', category: '', price: '', stock: '', description: '', discountPercent: '', image: null };

export default function AdminProductsPage() {
  const [products, setProducts]             = useState(initialProducts);
  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [editProduct, setEditProduct]       = useState(null);
  const [form, setForm]                     = useState(emptyForm);
  const [deleteDialog, setDeleteDialog]     = useState(null);
  const [page, setPage]                     = useState(1);
  const fileInputRef                        = useRef(null);
  const PER_PAGE = 8;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCategory === 'All' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name:            product.name,
      category:        product.category,
      price:           product.price,
      stock:           product.stock,
      description:     '',
      discountPercent: '',
      image:           product.image || null,
    });
    setDialogOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name || !form.category || !form.price) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (editProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                name:     form.name,
                category: form.category,
                price:    Number(form.price),
                stock:    Number(form.stock),
                status:   Number(form.stock) === 0 ? 'Out of Stock' : Number(form.stock) <= 5 ? 'Low Stock' : 'Active',
                image:    form.image,
              }
            : p
        )
      );
      toast.success('✅ Product updated successfully!');
    } else {
      setProducts((prev) => [
        {
          id:       Date.now(),
          name:     form.name,
          category: form.category,
          price:    Number(form.price),
          stock:    Number(form.stock),
          status:   Number(form.stock) === 0 ? 'Out of Stock' : 'Active',
          rating:   0,
          sales:    0,
          image:    form.image,
        },
        ...prev,
      ]);
      toast.success('✅ Product added successfully!');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    const target = deleteDialog;
    setDeleteDialog(null);
    setProducts((prev) => prev.filter((p) => p.id !== target.id));
    toast.success(`🗑️ "${target.name}" deleted.`);
  };

  return (
    <AdminShell>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: '1 1 200px', maxWidth: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
            htmlInput: { 'aria-label': 'Search products' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            label="Category"
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAdd}
          sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
        >
          Add Product
        </Button>
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Sales</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <Avatar
                          src={product.image}
                          alt={product.name}
                          variant="rounded"
                          sx={{ width: 44, height: 44, border: '1px solid #E7E5E4' }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{ width: 44, height: 44, bgcolor: '#F1F5F0', color: '#A8A29E' }}
                        >
                          <ImageNotSupported fontSize="small" />
                        </Avatar>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{product.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>{product.name}</TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{product.price}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: product.stock === 0 ? '#B91C1C' : product.stock <= 5 ? '#D97706' : '#1C1917' }}>
                      {product.stock}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>⭐ {product.rating}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{product.sales}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        size="small"
                        sx={{ ...statusColors[product.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(product)} sx={{ color: '#1B4332' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteDialog(product)} sx={{ color: '#B91C1C' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        {filtered.length > PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filtered.length / PER_PAGE)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editProduct ? 'Edit Product' : 'Add New Product'}
          <IconButton onClick={() => setDialogOpen(false)} size="small" aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>

            {/* Image upload */}
            <Grid size={12}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
                aria-label="Upload product image"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Preview */}
                <Avatar
                  src={form.image || undefined}
                  variant="rounded"
                  sx={{
                    width: 80, height: 80,
                    bgcolor: '#F1F5F0',
                    border: '2px dashed #D1D5DB',
                    color: '#A8A29E',
                    flexShrink: 0,
                  }}
                >
                  <ImageNotSupported />
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ borderColor: '#1B4332', color: '#1B4332', mb: 0.75 }}
                  >
                    {form.image ? 'Change Image' : 'Upload Image'}
                  </Button>
                  {form.image && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setForm((prev) => ({ ...prev, image: null }))}
                      sx={{ color: '#B91C1C', ml: 1 }}
                    >
                      Remove
                    </Button>
                  )}
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    JPG, PNG, WEBP — max 2 MB
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth label="Product Name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={form.category}
                  label="Category *"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Price (₹) *" type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Stock" type="number" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth label="Description" multiline rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Discount (%)" type="number" value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AdminShell>
  );
}
