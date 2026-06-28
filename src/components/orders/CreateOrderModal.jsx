'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert,
  IconButton, Tooltip, Divider,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { Modal, Select, TextInput, Textarea } from '@/components/ui';
import { ordersAPI, usersAPI, productsAPI, productVariantsAPI } from '@/lib/api';
import { PAYMENT_STATUS_LIST, capitalize, formatAmount, buildAddressLine } from '@/utils/orderUtils';
import { toast } from 'react-toastify';

// ─── Empty item row ───────────────────────────────────────────────────────────
const EMPTY_ITEM = () => ({
  _key:               Date.now() + Math.random(),
  product_id:         '',
  product_variant_id: '',
  quantity:           1,
  unit_price:         '',
  variants:           [],   // loaded after product select
  variantsLoading:    false,
});

// ─── Single item row ──────────────────────────────────────────────────────────
function ItemRow({ item, products, productsLoading, onChange, onRemove, canRemove }) {
  const handleProductChange = (productId) => {
    onChange({ ...item, product_id: productId, product_variant_id: '', unit_price: '', variants: [], variantsLoading: true });
    if (!productId) {
      onChange({ ...item, product_id: '', product_variant_id: '', unit_price: '', variants: [], variantsLoading: false });
      return;
    }
    // Load variants for this product
    productVariantsAPI.list({ page: 1, limit: 200, product_id: Number(productId) })
      .then((res) => {
        const variants = res?.data?.data ?? res?.data ?? [];
        onChange((prev) => prev._key === item._key
          ? { ...prev, product_id: productId, product_variant_id: '', unit_price: '', variants, variantsLoading: false }
          : prev);
      })
      .catch(() => onChange((prev) => prev._key === item._key
        ? { ...prev, product_id: productId, variants: [], variantsLoading: false }
        : prev));
  };

  const handleVariantChange = (variantId) => {
    const variant   = item.variants.find((v) => String(v.id) === String(variantId));
    const unitPrice = variant?.selling_price != null ? String(variant.selling_price) : '';
    onChange({ ...item, product_variant_id: variantId, unit_price: unitPrice });
  };

  const qty       = Math.max(1, parseInt(item.quantity, 10) || 1);
  const price     = parseFloat(item.unit_price) || 0;
  const lineTotal = qty * price;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Product */}
      <Box sx={{ flex: '2 1 160px', minWidth: 140 }}>
        <Select
          label="Product *"
          value={item.product_id}
          onChange={(e) => handleProductChange(e.target.value)}
          options={products.map((p) => ({ label: p.name, value: String(p.id) }))}
          disabled={productsLoading}
          size="small"
          fullWidth
        />
      </Box>

      {/* Variant */}
      <Box sx={{ flex: '2 1 160px', minWidth: 140 }}>
        <Select
          label="Variant *"
          value={item.product_variant_id}
          onChange={(e) => handleVariantChange(e.target.value)}
          options={item.variants.map((v) => ({ label: v.name, value: String(v.id) }))}
          disabled={!item.product_id || item.variantsLoading}
          size="small"
          fullWidth
        />
      </Box>

      {/* Qty */}
      <Box sx={{ flex: '0 0 72px' }}>
        <TextInput
          label="Qty *"
          type="number"
          value={String(item.quantity)}
          onChange={(e) => onChange({ ...item, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          size="small"
          slotProps={{ htmlInput: { min: 1, style: { textAlign: 'center' } } }}
        />
      </Box>

      {/* Unit price */}
      <Box sx={{ flex: '1 1 90px', minWidth: 80 }}>
        <TextInput
          label="Price *"
          type="number"
          value={item.unit_price}
          onChange={(e) => onChange({ ...item, unit_price: e.target.value })}
          size="small"
          slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
        />
      </Box>

      {/* Line total (read-only) */}
      <Box sx={{ flex: '1 1 90px', minWidth: 80 }}>
        <TextInput
          label="Line Total"
          value={lineTotal > 0 ? lineTotal.toFixed(2) : ''}
          readOnly
          size="small"
          sx={{ '& input': { color: '#1B4332', fontWeight: 700 } }}
        />
      </Box>

      {/* Remove */}
      <Box sx={{ pt: 1 }}>
        <Tooltip title="Remove item">
          <span>
            <IconButton size="small" onClick={onRemove} disabled={!canRemove}
              sx={{ color: canRemove ? '#B91C1C' : 'text.disabled' }}>
              <Delete fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
/**
 * CreateOrderModal — admin manual order creation.
 * Props:
 *   open      bool
 *   onClose   () => void
 *   onCreated (newOrder) => void
 */
export default function CreateOrderModal({ open, onClose, onCreated }) {
  const [userId,          setUserId]          = useState('');
  const [addressId,       setAddressId]       = useState('');
  const [paymentStatus,   setPaymentStatus]   = useState('pending');
  const [discount,        setDiscount]        = useState('0');
  const [shipping,        setShipping]        = useState('0');
  const [tax,             setTax]             = useState('0');
  const [notes,           setNotes]           = useState('');
  const [items,           setItems]           = useState([EMPTY_ITEM()]);

  const [users,           setUsers]           = useState([]);
  const [usersLoading,    setUsersLoading]    = useState(false);
  const [addresses,       setAddresses]       = useState([]);
  const [addressesLoading,setAddressesLoading]= useState(false);
  const [products,        setProducts]        = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors,    setErrors]    = useState({});
  const [genError,  setGenError]  = useState('');

  // Load users + products on open
  useEffect(() => {
    if (!open) return;
    // Reset form
    setUserId(''); setAddressId(''); setPaymentStatus('pending');
    setDiscount('0'); setShipping('0'); setTax('0'); setNotes('');
    setItems([EMPTY_ITEM()]); setErrors({}); setGenError('');
    setAddresses([]);

    setUsersLoading(true);
    usersAPI.list({ page: 1, limit: 200 })
      .then((res) => setUsers(res?.data?.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));

    setProductsLoading(true);
    productsAPI.list({ page: 1, limit: 200 })
      .then((res) => setProducts(res?.data?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [open]);

  // Load addresses when user changes
  useEffect(() => {
    if (!userId) { setAddresses([]); setAddressId(''); return; }
    setAddressesLoading(true);
    setAddressId('');
    ordersAPI.getUserAddresses({ user_id: Number(userId) })
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setAddresses(list);
      })
      .catch(() => setAddresses([]))
      .finally(() => setAddressesLoading(false));
  }, [userId]);

  const updateItem = useCallback((key, updaterOrObj) => {
    setItems((prev) => prev.map((it) => {
      if (it._key !== key) return it;
      return typeof updaterOrObj === 'function' ? updaterOrObj(it) : { ...it, ...updaterOrObj };
    }));
  }, []);

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()]);

  const removeItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));

  // Live calculations
  const subtotal = items.reduce((sum, it) => {
    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    const price = parseFloat(it.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const discountNum  = parseFloat(discount)  || 0;
  const shippingNum  = parseFloat(shipping)  || 0;
  const taxNum       = parseFloat(tax)       || 0;
  const total        = Math.max(0, subtotal - discountNum + shippingNum + taxNum);

  const validate = () => {
    const errs = {};
    if (!userId)    errs.user_id    = 'Customer is required.';
    if (!addressId) errs.address_id = 'Delivery address is required.';
    const badItems = items.filter((it) => !it.product_variant_id || !it.unit_price || parseFloat(it.unit_price) <= 0);
    if (badItems.length) errs.items = 'Each item needs a variant and a valid price.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGenError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      user_id:         Number(userId),
      address_id:      Number(addressId),
      payment_status:  paymentStatus,
      discount_amount: discountNum,
      shipping_amount: shippingNum,
      tax_amount:      taxNum,
      notes:           notes.trim() || null,
      items: items.map((it) => ({
        product_variant_id: Number(it.product_variant_id),
        quantity:           Math.max(1, parseInt(it.quantity, 10) || 1),
        unit_price:         parseFloat(it.unit_price),
      })),
    };

    setIsLoading(true);
    ordersAPI.create(payload)
      .then((res) => {
        toast.success('Order created successfully.');
        onCreated(res?.data);
        onClose();
      })
      .catch((err) => {
        const msg = typeof err === 'string' ? err : 'Failed to create order.';
        setGenError(msg);
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  const clearErr = (key) => setErrors((p) => ({ ...p, [key]: '' }));

  return (
    <Modal open={open} onClose={onClose} title="Create Manual Order" maxWidth="lg">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {genError && <Alert severity="error" sx={{ borderRadius: 2 }}>{genError}</Alert>}

          {/* ── Customer + Address ── */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 220px' }}>
              <Select
                label="Customer *"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); clearErr('user_id'); }}
                options={users.map((u) => ({ label: `${u.name} (${u.email})`, value: String(u.id) }))}
                disabled={usersLoading}
                error={errors.user_id}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: '1 1 260px' }}>
              <Select
                label="Delivery Address *"
                value={addressId}
                onChange={(e) => { setAddressId(e.target.value); clearErr('address_id'); }}
                options={addresses.map((a) => ({
                  label: `${a.address_type?.toUpperCase() ?? ''} — ${a.name}, ${buildAddressLine(a)}`.slice(0, 80),
                  value: String(a.id),
                }))}
                disabled={!userId || addressesLoading}
                error={errors.address_id}
                fullWidth
              />
            </Box>
          </Box>

          {/* ── Items ── */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1B4332' }}>
              Order Items
            </Typography>
            {errors.items && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 1.5 }}>{errors.items}</Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <ItemRow
                  key={item._key}
                  item={item}
                  products={products}
                  productsLoading={productsLoading}
                  onChange={(updater) => {
                    if (typeof updater === 'function') {
                      setItems((prev) => prev.map((it) => it._key === item._key ? updater(it) : it));
                    } else {
                      setItems((prev) => prev.map((it) => it._key === item._key ? { ...it, ...updater, _key: it._key } : it));
                    }
                  }}
                  onRemove={() => removeItem(item._key)}
                  canRemove={items.length > 1}
                />
              ))}
            </Box>
            <Button
              size="small" startIcon={<Add />} onClick={addItem}
              sx={{ mt: 1.5, color: '#1B4332', borderColor: '#1B4332', fontWeight: 600 }}
              variant="outlined"
            >
              Add Another Item
            </Button>
          </Box>

          <Divider />

          {/* ── Charges row ── */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextInput label="Discount (₹)" type="number" value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              sx={{ flex: '1 1 120px' }} size="small" />
            <TextInput label="Shipping (₹)" type="number" value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              sx={{ flex: '1 1 120px' }} size="small" />
            <TextInput label="Tax (₹)" type="number" value={tax}
              onChange={(e) => setTax(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              sx={{ flex: '1 1 120px' }} size="small" />
            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={PAYMENT_STATUS_LIST.map((s) => ({ label: capitalize(s), value: s }))}
              sx={{ flex: '1 1 140px' }}
              size="small"
              fullWidth
            />
          </Box>

          {/* Notes */}
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any internal notes for this order"
          />

          {/* ── Live order summary ── */}
          <Box sx={{ bgcolor: '#F8FBF8', borderRadius: 2, p: 2, border: '1px solid #E7E5E4' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1B4332' }}>
              Order Summary
            </Typography>
            {[
              { label: 'Subtotal',  value: formatAmount(subtotal) },
              { label: 'Discount',  value: `−${formatAmount(discountNum)}`, color: '#166534' },
              { label: 'Shipping',  value: formatAmount(shippingNum) },
              { label: 'Tax',       value: formatAmount(taxNum) },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ color: color || 'text.primary' }}>{value}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 0.75 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>Total</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1B4332', fontSize: 15 }}>
                {formatAmount(total)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 150 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Create Order'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
