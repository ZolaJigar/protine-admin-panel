'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert,
  Autocomplete, TextField, InputAdornment, Avatar,
} from '@mui/material';
import { Modal } from '@/components/ui';
import { cartsAPI, usersAPI, productsAPI, productVariantsAPI } from '@/lib/api';
import { formatAmount } from '@/utils/cartUtils';
import { toast } from 'react-toastify';

/**
 * AddItemModal — admin form to add an item to a user's cart.
 * Props:
 *   open       bool
 *   onClose    () => void
 *   onAdded    (updatedCart) => void  — called on success
 *   prefillUserId  number|null       — pre-select a user (e.g. from cart detail page)
 */
export default function AddItemModal({ open, onClose, onAdded, prefillUserId = null }) {
  // ── Field state ────────────────────────────────────────────────────────────
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity,        setQuantity]        = useState(1);
  const [error,           setError]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);

  // ── Options state ──────────────────────────────────────────────────────────
  const [users,         setUsers]         = useState([]);
  const [usersLoading,  setUsersLoading]  = useState(false);
  const [products,      setProducts]      = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [variants,      setVariants]      = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // ── Load users + products on open ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    // Reset form
    setSelectedVariant(null);
    setQuantity(1);
    setError('');
    setSelectedProduct(null);
    setVariants([]);

    // Pre-fill user if provided
    if (prefillUserId && users.length > 0) {
      const found = users.find((u) => u.id === prefillUserId);
      if (found) setSelectedUser(found);
    }

    // Load users
    setUsersLoading(true);
    usersAPI.list({ page: 1, limit: 999 })
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setUsers(list);
        if (prefillUserId) {
          const found = list.find((u) => u.id === prefillUserId);
          if (found) setSelectedUser(found);
        }
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));

    // Load products
    setProductsLoading(true);
    productsAPI.list({ page: 1, limit: 999 })
      .then((res) => setProducts(res?.data?.data ?? res?.data ?? []))
      .catch(() => {})
      .finally(() => setProductsLoading(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Load variants when product changes ─────────────────────────────────────
  useEffect(() => {
    setSelectedVariant(null);
    setVariants([]);
    if (!selectedProduct) return;

    setVariantsLoading(true);
    productVariantsAPI.list({ page: 1, limit: 999, product_id: selectedProduct.id })
      .then((res) => setVariants(res?.data?.data ?? res?.data ?? []))
      .catch(() => {})
      .finally(() => setVariantsLoading(false));
  }, [selectedProduct]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUser)    { setError('Please select a user.');            return; }
    if (!selectedVariant) { setError('Please select a product variant.'); return; }
    if (quantity < 1)     { setError('Quantity must be at least 1.');     return; }

    setIsLoading(true);
    cartsAPI.addItem({
      user_id:            selectedUser.id,
      product_variant_id: selectedVariant.id,
      quantity,
    })
      .then((res) => {
        toast.success('Item added to cart.');
        onAdded(res?.data ?? null);
        onClose();
      })
      .catch((err) => {
        const msg = typeof err === 'string' ? err : 'Failed to add item to cart.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  const handleClose = () => {
    if (isLoading) return;
    setSelectedUser(null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Item to Cart" maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          {/* User */}
          <Autocomplete
            options={users}
            loading={usersLoading}
            value={selectedUser}
            onChange={(_, val) => setSelectedUser(val)}
            getOptionLabel={(u) => u ? `${u.name} (${u.email})` : ''}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            renderOption={(props, u) => (
              <Box component="li" {...props} key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 10, fontWeight: 800 }}>
                  {(u.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{u.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="User *"
                placeholder="Search user by name or email"
                size="small"
                slotProps={{
                  input: { ...params.InputProps },
                }}
              />
            )}
            disabled={!!prefillUserId}
          />

          {/* Product */}
          <Autocomplete
            options={products}
            loading={productsLoading}
            value={selectedProduct}
            onChange={(_, val) => setSelectedProduct(val)}
            getOptionLabel={(p) => p?.name ?? ''}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            renderInput={(params) => (
              <TextField {...params} label="Product *" placeholder="Select a product" size="small" />
            )}
          />

          {/* Variant */}
          <Autocomplete
            options={variants}
            loading={variantsLoading}
            value={selectedVariant}
            onChange={(_, val) => setSelectedVariant(val)}
            getOptionLabel={(v) => v ? `${v.name} — ${v.sku}` : ''}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            disabled={!selectedProduct}
            renderOption={(props, v) => (
              <Box component="li" {...props} key={v.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{v.name}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">SKU: {v.sku}</Typography>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                    {formatAmount(v.selling_price)}
                  </Typography>
                  {v.stock_quantity != null && (
                    <Typography variant="caption" color="text.secondary">
                      Stock: {v.stock_quantity}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product Variant *"
                placeholder={selectedProduct ? 'Select a variant' : 'Select a product first'}
                size="small"
              />
            )}
          />

          {/* Selected variant info */}
          {selectedVariant && (
            <Box sx={{ p: 1.5, bgcolor: '#F8FBF8', borderRadius: 2, border: '1px solid #E7E5E4' }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 10, textTransform: 'uppercase' }}>Selling Price</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>{formatAmount(selectedVariant.selling_price)}</Typography>
                </Box>
                {selectedVariant.mrp && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 10, textTransform: 'uppercase' }}>MRP</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatAmount(selectedVariant.mrp)}</Typography>
                  </Box>
                )}
                {selectedVariant.stock_quantity != null && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 10, textTransform: 'uppercase' }}>In Stock</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedVariant.stock_quantity}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Quantity */}
          <TextField
            label="Quantity *"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            size="small"
            inputProps={{ min: 1 }}
            slotProps={{
              input: {
                endAdornment: selectedVariant && (
                  <InputAdornment position="end">
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                      = {formatAmount(parseFloat(selectedVariant.selling_price || 0) * quantity)}
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button
            type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Add to Cart'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
