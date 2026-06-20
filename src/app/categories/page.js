'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField,
  Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Grid, Chip,
} from '@mui/material';
import { Add, Edit, Delete, Close } from '@mui/icons-material';
import { toast } from 'react-toastify';

const initialCategories = [
  { id: 1, name: 'Ketchup',         description: 'Tomato-based ketchup products',       products: 3,  slug: 'ketchup'         },
  { id: 2, name: 'Mayonnaise',      description: 'Creamy mayo varieties',                products: 4,  slug: 'mayonnaise'      },
  { id: 3, name: 'Hot Sauces',      description: 'Spicy and fiery sauce collection',     products: 5,  slug: 'hot-sauces'      },
  { id: 4, name: 'Salad Dressings', description: 'Refreshing dressings for salads',      products: 3,  slug: 'salad-dressings' },
  { id: 5, name: 'Spreads',         description: 'Delicious spreads and chutneys',       products: 3,  slug: 'spreads'         },
  { id: 6, name: 'Healthy Snacks',  description: 'Nutritious snack options',             products: 0,  slug: 'healthy-snacks'  },
];

const emptyForm = { name: '', description: '', slug: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories]     = useState(initialCategories);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const openAdd = () => {
    setEditCategory(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description, slug: cat.slug });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error('Category name is required.');
      return;
    }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    if (editCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editCategory.id
            ? { ...c, name: form.name, description: form.description, slug }
            : c
        )
      );
      toast.success('✅ Category updated!');
    } else {
      setCategories((prev) => [
        ...prev,
        { id: Date.now(), name: form.name, description: form.description, slug, products: 0 },
      ]);
      toast.success('✅ Category added!');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    const target = deleteDialog;
    setDeleteDialog(null);
    setCategories((prev) => prev.filter((c) => c.id !== target.id));
    toast.success(`🗑️ "${target.name}" deleted.`);
  };

  return (
    <AdminShell>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAdd}
          sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
        >
          Add Category
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Products</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{cat.id}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                <TableCell>
                  <Chip label={cat.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 12 }} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{cat.description}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{cat.products}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(cat)} sx={{ color: '#1B4332' }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteDialog(cat)} sx={{ color: '#B91C1C' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editCategory ? 'Edit Category' : 'Add Category'}
          <IconButton onClick={() => setDialogOpen(false)} size="small" aria-label="Close"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <TextField fullWidth label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Slug (auto-generated if blank)" value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editCategory ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteDialog?.name}</strong>? Products in this category will become uncategorized.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AdminShell>
  );
}

