/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Chip, Skeleton, Stack, Alert, CircularProgress, Divider,
  Avatar, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Visibility,
  ImageNotSupported, CloudUpload, ArrowBack,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const limit          = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE  = 5 * 1024 * 1024;
const WEIGHT_UNITS   = ['g', 'kg', 'ltr', 'ml'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  return '₹' + Number(val).toFixed(2);
}

function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, GIF, or WebP images are allowed.';
  if (file.size > MAX_FILE_SIZE) return 'Image must be under 5 MB.';
  return null;
}

function buildSkuPreview(productName, variantName, weight, weightUnit) {
  const parts = [];
  if (productName) parts.push(productName.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''));
  if (variantName)  parts.push(variantName.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''));
  if (weight)       parts.push(String(weight) + (weightUnit || ''));
  return parts.join('-') || null;
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ cols = 10 }) {
  return Array.from({ length: limit }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: cols }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search, colSpan = 10 }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          {search ? `No variants found for "${search}"` : 'No variants yet'}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {search ? 'Try a different search term.' : 'Click "Add Variant" to create the first one.'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Variant thumbnail ────────────────────────────────────────────────────────
function VariantThumb({ src, name, size = 44 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <Avatar variant="rounded" sx={{ width: size, height: size, bgcolor: '#F1F5F0', color: '#A8A29E' }}>
        <ImageNotSupported fontSize="small" />
      </Avatar>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', border: '1px solid #E7E5E4', display: 'block', flexShrink: 0 }} />
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ open, itemData, onClose }) {
  const ref = useRef(itemData);
  if (itemData) ref.current = itemData;
  const item = ref.current;
  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Variant Details
        <IconButton onClick={onClose} size="small" aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {item.image && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <VariantThumb src={item.image} name={item.name} size={140} />
            </Box>
          )}
          {[
            { label: 'SKU',           value: item.sku ? <Chip label={item.sku} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /> : '—' },
            { label: 'Name',          value: item.name || '—' },
            { label: 'Product',       value: item.product?.name || '—' },
            { label: 'Category',      value: item.product?.category?.name || '—' },
            { label: 'Weight',        value: item.weight ? `${item.weight} ${item.weight_unit || ''}`.trim() : '—' },
            { label: 'MRP',           value: formatPrice(item.mrp) },
            { label: 'Selling Price', value: formatPrice(item.selling_price) },
            { label: 'Cost Price',    value: formatPrice(item.cost_price) },
            { label: 'Stock Qty',     value: item.quantity ?? '—' },
            { label: 'Barcode',       value: item.barcode || '—' },
            { label: 'Status',        value: item.is_active
                ? <Chip label="Active"   size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
                : <Chip label="Inactive" size="small" sx={{ bgcolor: '#F5F5F5', color: '#57534E', fontWeight: 700 }} /> },
            { label: 'Created',       value: formatDate(item.createdAt) },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography component="div" sx={{ width: 120, fontWeight: 700, color: 'text.secondary', flexShrink: 0, fontSize: 14 }}>{label}</Typography>
              <Typography component="div" sx={{ flex: 1 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved, fixedProductId }) {
  const isEdit = !!itemId;

  const [isLoading, setIsLoading]             = useState(false);
  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [form, setForm]                       = useState({
    product_id: '', name: '', weight: '', weight_unit: '',
    mrp: '', selling_price: '', cost_price: '', barcode: '',
    quantity: '', is_active: true,
  });
  const [imageFile, setImageFile]             = useState(null);
  const [imagePreview, setImagePreview]       = useState('');
  const [fieldErrors, setFieldErrors]         = useState({});
  const [generalError, setGeneralError]       = useState('');
  const [pricingWarning, setPricingWarning]   = useState('');
  const fileInputRef                          = useRef();

  useEffect(() => {
    if (open) {
      setProductsLoading(true);
      apiPost('/products/list', { page: 1, limit: 100 })
        .then((res) => setProducts(res?.data?.data ?? []))
        .catch(() => setProducts([]))
        .finally(() => setProductsLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (isEdit && itemData) {
        setForm({
          product_id:    fixedProductId ? String(fixedProductId) : String(itemData.product_id || itemData.product?.id || ''),
          name:          itemData.name          || '',
          weight:        itemData.weight        != null ? String(itemData.weight) : '',
          weight_unit:   itemData.weight_unit   || '',
          mrp:           itemData.mrp           != null ? String(itemData.mrp)   : '',
          selling_price: itemData.selling_price != null ? String(itemData.selling_price) : '',
          cost_price:    itemData.cost_price    != null ? String(itemData.cost_price)    : '',
          barcode:       itemData.barcode       || '',
          quantity:      itemData.quantity      != null ? String(itemData.quantity) : '',
          is_active:     itemData.is_active !== undefined ? !!itemData.is_active : true,
        });
        setImagePreview(itemData.image || '');
      } else {
        setForm({
          product_id: fixedProductId ? String(fixedProductId) : '',
          name: '', weight: '', weight_unit: '',
          mrp: '', selling_price: '', cost_price: '',
          barcode: '', quantity: '', is_active: true,
        });
        setImagePreview('');
      }
      setImageFile(null);
      setFieldErrors({});
      setGeneralError('');
      setPricingWarning('');
    }
  }, [open, isEdit, itemData, fixedProductId]);

  const setField = (key, val) => {
    setForm((p) => {
      const next = { ...p, [key]: val };
      const sp   = parseFloat(key === 'selling_price' ? val : next.selling_price);
      const mrp  = parseFloat(key === 'mrp' ? val : next.mrp);
      if (!isNaN(sp) && !isNaN(mrp) && sp > mrp) {
        setPricingWarning('Selling price is greater than MRP.');
      } else {
        setPricingWarning('');
      }
      return next;
    });
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errors = {};
    if (!form.product_id)                                errors.product_id    = 'Product is required';
    if (!form.name.trim())                               errors.name          = 'Name is required';
    else if (form.name.length > 255)                     errors.name          = 'Max 255 characters';
    if (form.mrp === '' || form.mrp === null)            errors.mrp           = 'MRP is required';
    else if (isNaN(Number(form.mrp)) || Number(form.mrp) < 0) errors.mrp     = 'MRP must be 0 or more';
    if (form.selling_price === '' || form.selling_price === null) errors.selling_price = 'Selling price is required';
    else if (isNaN(Number(form.selling_price)) || Number(form.selling_price) < 0) errors.selling_price = 'Selling price must be 0 or more';
    if (form.weight && !form.weight_unit)                errors.weight_unit   = 'Weight unit required when weight is set';
    if (form.barcode && form.barcode.length > 100)       errors.barcode       = 'Max 100 characters';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const fd = new FormData();
    if (isEdit) {
      fd.append('product_id',    form.product_id);
      fd.append('name',          form.name.trim());
      fd.append('mrp',           form.mrp);
      fd.append('selling_price', form.selling_price);
      fd.append('is_active',     form.is_active ? 1 : 0);
      if (form.weight)      fd.append('weight',      form.weight);
      if (form.weight_unit) fd.append('weight_unit', form.weight_unit);
      if (form.cost_price)  fd.append('cost_price',  form.cost_price);
      if (form.barcode)     fd.append('barcode',      form.barcode.trim());
      if (form.quantity)    fd.append('quantity',     form.quantity);
      if (imageFile)        fd.append('image',        imageFile);
    } else {
      fd.append('product_id',    form.product_id);
      fd.append('name',          form.name.trim());
      fd.append('mrp',           form.mrp);
      fd.append('selling_price', form.selling_price);
      if (form.weight)      fd.append('weight',      form.weight);
      if (form.weight_unit) fd.append('weight_unit', form.weight_unit);
      if (form.cost_price)  fd.append('cost_price',  form.cost_price);
      if (form.barcode)     fd.append('barcode',      form.barcode.trim());
      if (form.quantity)    fd.append('quantity',     form.quantity);
      if (imageFile)        fd.append('image',        imageFile);
    }

    setIsLoading(true);
    const apiCall = isEdit
      ? apiPut(`/product-variants/update/${itemId}`, fd, {}, 'multipart/form-data')
      : apiPost('/product-variants/create', fd, {}, 'multipart/form-data');

    apiCall
      .then(() => {
        toast.success(isEdit ? 'Variant updated successfully!' : 'Variant created successfully!');
        onSaved();
        onClose();
      })
      .catch((err) => { setGeneralError(err); toast.error(err); })
      .finally(() => setIsLoading(false));
  };

  const selectedProduct = products.find((p) => String(p.id) === String(form.product_id));
  const skuPreview = buildSkuPreview(selectedProduct?.name, form.name, form.weight, form.weight_unit);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? 'Edit Variant' : 'Add Variant'}
        <IconButton onClick={onClose} size="small" aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}
          {pricingWarning && <Alert severity="warning" sx={{ borderRadius: 2 }}>{pricingWarning}</Alert>}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth error={!!fieldErrors.product_id} disabled={productsLoading || !!fixedProductId}>
              <InputLabel>Product *</InputLabel>
              <Select value={form.product_id} label="Product *"
                onChange={(e) => setField('product_id', e.target.value)}>
                {products.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
              </Select>
              {fieldErrors.product_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{fieldErrors.product_id}</Typography>
              )}
            </FormControl>
            <TextField fullWidth label="Variant Name *" value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={!!fieldErrors.name} helperText={fieldErrors.name} />
          </Box>

          {skuPreview && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: -1.5 }}>
              <Typography variant="caption" color="text.secondary">SKU preview:</Typography>
              <Chip label={skuPreview} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
              <Typography variant="caption" color="text.disabled">(generated by server)</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Weight" type="number" value={form.weight}
              onChange={(e) => setField('weight', e.target.value)}
              error={!!fieldErrors.weight} helperText={fieldErrors.weight} />
            <FormControl fullWidth error={!!fieldErrors.weight_unit}>
              <InputLabel>Weight Unit</InputLabel>
              <Select value={form.weight_unit} label="Weight Unit"
                onChange={(e) => setField('weight_unit', e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {WEIGHT_UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
              {fieldErrors.weight_unit && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{fieldErrors.weight_unit}</Typography>
              )}
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="MRP *" type="number" value={form.mrp}
              onChange={(e) => setField('mrp', e.target.value)}
              error={!!fieldErrors.mrp} helperText={fieldErrors.mrp} />
            <TextField fullWidth label="Selling Price *" type="number" value={form.selling_price}
              onChange={(e) => setField('selling_price', e.target.value)}
              error={!!fieldErrors.selling_price} helperText={fieldErrors.selling_price} />
            <TextField fullWidth label="Cost Price" type="number" value={form.cost_price}
              onChange={(e) => setField('cost_price', e.target.value)} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Barcode" value={form.barcode}
              onChange={(e) => setField('barcode', e.target.value)}
              error={!!fieldErrors.barcode} helperText={fieldErrors.barcode} />
            <TextField fullWidth label="Stock Quantity" type="number" value={form.quantity}
              onChange={(e) => setField('quantity', e.target.value)} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Image (optional · JPEG/PNG/GIF/WebP · max 5 MB)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {imagePreview ? (
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview"
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, display: 'block', border: '2px solid #E7E5E4' }} />
                  <IconButton size="small" onClick={removeImage} aria-label="Remove image"
                    sx={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#7F1D1D' } }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ) : (
                <Avatar variant="rounded" sx={{ width: 80, height: 80, bgcolor: '#F1F5F0', border: '2px dashed #D1D5DB', color: '#A8A29E' }}>
                  <ImageNotSupported />
                </Avatar>
              )}
              <Box>
                <Button variant="outlined" size="small" startIcon={<CloudUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderColor: '#1B4332', color: '#1B4332', mb: 0.5 }}>
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                {imagePreview && (
                  <Button variant="text" size="small" onClick={removeImage} sx={{ color: '#B91C1C', ml: 1 }}>Remove</Button>
                )}
              </Box>
            </Box>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }} onChange={handleFileChange} />
          </Box>

          {isEdit && (
            <FormControlLabel label="Active (visible on storefront)" control={
              <Switch checked={!!form.is_active}
                onChange={(e) => setField('is_active', e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1B4332' } }} />
            } />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" />
              : isEdit ? 'Save Changes' : 'Add Variant'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemName, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef(itemName);
  if (itemName) nameRef.current = itemName;

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    apiDelete(`/product-variants/delete/${itemId}`)
      .then(() => {
        toast.success(`"${nameRef.current}" deleted.`);
        onDeleted();
        onClose();
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete Variant</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography>
          Are you sure you want to delete variant <strong>{nameRef.current}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button variant="contained" onClick={handleDelete} disabled={isLoading}
          sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 100 }}>
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page (product-scoped) ───────────────────────────────────────────────
export default function ProductVariantsPage() {
  const router    = useRouter();
  const params    = useParams();
  const productId = params.id;

  const [productName, setProductName]         = useState('');
  const [isSearch, setIsSearch]               = useState(false);
  const [isTableLoading, setIsTableLoading]   = useState(false);
  const [itemId, setItemId]                   = useState(null);
  const [itemData, setItemData]               = useState(null);
  const [openAdd, setOpenAdd]                 = useState(false);
  const [openEdit, setOpenEdit]               = useState(false);
  const [openView, setOpenView]               = useState(false);
  const [openDelete, setOpenDelete]           = useState(false);
  const [count, setCount]                     = useState(0);
  const [offset, setOffset]                   = useState(0);
  const [pageValue, setPageValue]             = useState(0);
  const [search, setSearch]                   = useState('');
  const [tableData, setTableData]             = useState([]);

  // api calls
  const getData = (searchVal = search, pageVal = pageValue) => {
    setIsTableLoading(true);
    apiPost('/product-variants/list', {
      page: pageVal + 1,
      limit,
      search: searchVal.trim(),
      product_id: Number(productId),
    })
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getProductName = () => {
    apiGet('/products/' + productId)
      .then((res) => {
        const p = res?.data ?? res;
        setProductName(p?.name || `#${productId}`);
      })
      .catch(() => setProductName(`#${productId}`));
  };

  const getById = (id) => {
    apiGet(`/product-variants/${id}`)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  // effects
  useEffect(() => {
    getProductName();
    getData();
  }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => {
        setOffset(0);
        setPageValue(0);
        getData(search, 0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit);
    setPageValue(newPage);
    getData(search, newPage);
  };

  const handleOpenView = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenView(true);
    getById(row.id);
  };

  const handleOpenEdit = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenEdit(true);
    getById(row.id);
  };

  const handleOpenDelete = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenDelete(true);
  };

  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseView   = () => { setOpenView(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  return (
    <AdminShell>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Variants — {productName || `Product #${productId}`}
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField size="small" placeholder="Search variants…" value={search}
            onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 250 }}
          />

          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Variant
          </Button>

          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/products')}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
            Back to Products
          </Button>
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell sx={{ width: 60 }}>Image</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>MRP</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows cols={11} />
              ) : tableData.length === 0 ? (
                <EmptyState search={search} colSpan={11} />
              ) : (
                tableData.map((row, idx) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</TableCell>
                    <TableCell><VariantThumb src={row.image} name={row.name} size={44} /></TableCell>
                    <TableCell>
                      {row.sku
                        ? <Chip label={row.sku} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                        : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {row.weight ? `${row.weight} ${row.weight_unit || ''}`.trim() : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{formatPrice(row.mrp)}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{formatPrice(row.selling_price)}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{row.quantity ?? '—'}</TableCell>
                    <TableCell align="center">
                      {row.is_active
                        ? <Chip label="Active"   size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
                        : <Chip label="Inactive" size="small" sx={{ bgcolor: '#F5F5F5', color: '#57534E', fontWeight: 700 }} />}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleOpenView(row)} sx={{ color: '#0369A1' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#1B4332' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
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

        <TablePagination
          component="div"
          count={count}
          page={pageValue}
          onPageChange={(_, newPage) => handleTableChange(newPage)}
          rowsPerPage={limit}
          rowsPerPageOptions={[limit]}
          sx={{ borderTop: '1px solid #E7E5E4' }}
        />
      </Paper>

      {/* ── Modals ── */}
      <FormModal
        open={openAdd}
        itemId={null}
        itemData={null}
        onClose={handleCloseAdd}
        onSaved={() => getData(search, pageValue)}
        fixedProductId={productId}
      />

      <FormModal
        open={openEdit}
        itemId={itemId}
        itemData={itemData}
        onClose={handleCloseEdit}
        onSaved={() => getData(search, pageValue)}
        fixedProductId={productId}
      />

      <ViewModal
        open={openView}
        itemData={itemData}
        onClose={handleCloseView}
      />

      <DeleteModal
        open={openDelete}
        itemId={itemId}
        itemName={itemData?.name}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) {
            handleTableChange(pageValue - 1);
          } else {
            getData(search, pageValue);
          }
        }}
      />
    </AdminShell>
  );
}
