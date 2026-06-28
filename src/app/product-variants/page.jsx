/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
  Avatar, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Visibility,
  ImageNotSupported, CloudUpload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_LIMIT, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE, WEIGHT_UNITS } from '@/constants/values';
import { dateFormat12, formatPrice, validateImageFile } from '@/utils/functions';

// ─── Local aliases ────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ACCEPTED_IMAGE_TYPES;
const MAX_FILE_SIZE  = MAX_IMAGE_SIZE;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = dateFormat12;

function buildSkuPreview(productName, variantName, weight, weightUnit) {
  const parts = [];
  if (productName) parts.push(productName.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''));
  if (variantName)  parts.push(variantName.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''));
  if (weight)       parts.push(String(weight) + (weightUnit || ''));
  return parts.join('-') || null;
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
    <Modal open={open} onClose={onClose} title="Variant Details" maxWidth="sm"
      actions={<Button variant="outlined" onClick={onClose}>Close</Button>}
    >
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
      </Modal>
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
      apiPost('/admin/products/list', { page: 1, limit: 100 })
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
    if (fieldErrors.image) setFieldErrors((p) => ({ ...p, image: '' }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Regex: allows positive integers or decimals (e.g. 100, 99.99, 0.5). No negatives.
  const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

  const validateField = (key, val) => {
    switch (key) {
      case 'product_id':    return !val                        ? 'Product is required'                     : '';
      case 'name':          return !val.trim()                 ? 'Variant name is required'
                                 : val.length > 255            ? 'Max 255 characters'                      : '';
      case 'mrp':           return val === '' || val === null  ? 'MRP is required'
                                 : !PRICE_REGEX.test(val)      ? 'Enter a valid price (e.g. 99 or 99.99)'  : '';
      case 'selling_price': return val === '' || val === null  ? 'Selling price is required'
                                 : !PRICE_REGEX.test(val)      ? 'Enter a valid price (e.g. 99 or 99.99)'  : '';
      case 'cost_price':    return val !== '' && !PRICE_REGEX.test(val)
                                                               ? 'Enter a valid price (e.g. 99 or 99.99)'  : '';
      case 'weight_unit':   return form.weight && !val         ? 'Weight unit required when weight is set' : '';
      case 'barcode':       return val && val.length > 100     ? 'Max 100 characters'                      : '';
      default:              return '';
    }
  };

  // Block any key that is not a digit, decimal point, or control key
  const handlePriceKeyDown = (e) => {
    const ALLOWED_KEYS = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
    ];
    // Allow control combos (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z)
    if (e.ctrlKey || e.metaKey) return;
    if (ALLOWED_KEYS.includes(e.key)) return;
    // Allow digits 0-9
    if (/^\d$/.test(e.key)) return;
    // Allow a single decimal point
    if (e.key === '.') {
      // Prevent a second dot
      if (e.target.value.includes('.')) e.preventDefault();
      return;
    }
    // Block everything else
    e.preventDefault();
  };

  const handleBlur = (key) => {
    const val   = form[key] ?? '';
    const msg   = validateField(key, val);
    setFieldErrors((prev) => ({ ...prev, [key]: msg }));
  };

  const validate = () => {
    const errors = {};
    ['product_id', 'name', 'mrp', 'selling_price', 'cost_price', 'weight_unit', 'barcode'].forEach((key) => {
      const msg = validateField(key, form[key] ?? '');
      if (msg) errors[key] = msg;
    });
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Variant' : 'Add Variant'} maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}
          {pricingWarning && <Alert severity="warning" sx={{ borderRadius: 2 }}>{pricingWarning}</Alert>}

          {/* Row 1: Product + Name */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Select
              label="Product *"
              value={form.product_id}
              onChange={(e) => setField('product_id', e.target.value)}
              onBlur={() => handleBlur('product_id')}
              options={products.map((p) => ({ label: p.name, value: String(p.id) }))}
              error={fieldErrors.product_id}
              disabled={productsLoading || !!fixedProductId}
              required
              fullWidth
            />
            <TextInput
              label="Variant Name *"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={fieldErrors.name}
              required
            />
          </Box>

          {/* SKU preview */}
          {skuPreview && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: -1.5 }}>
              <Typography variant="caption" color="text.secondary">SKU preview:</Typography>
              <Chip label={skuPreview} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
              <Typography variant="caption" color="text.disabled">(generated by server)</Typography>
            </Box>
          )}

          {/* Row 2: Weight + Unit */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput
              label="Weight"
              value={form.weight}
              onChange={(e) => setField('weight', e.target.value)}
              error={fieldErrors.weight}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <Select
              label="Weight Unit"
              value={form.weight_unit}
              onChange={(e) => setField('weight_unit', e.target.value)}
              options={[
                { label: 'None', value: '' },
                ...WEIGHT_UNITS.map((u) => ({ label: u, value: u })),
              ]}
              error={fieldErrors.weight_unit}
              fullWidth
            />
          </Box>

          {/* Row 3: MRP + Selling Price + Cost Price */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput
              label="MRP *"
              value={form.mrp}
              onChange={(e) => setField('mrp', e.target.value)}
              onBlur={() => handleBlur('mrp')}
              onKeyDown={handlePriceKeyDown}
              error={fieldErrors.mrp}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              required
            />
            <TextInput
              label="Selling Price *"
              value={form.selling_price}
              onChange={(e) => setField('selling_price', e.target.value)}
              onBlur={() => handleBlur('selling_price')}
              onKeyDown={handlePriceKeyDown}
              error={fieldErrors.selling_price}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              required
            />
            <TextInput
              label="Cost Price"
              value={form.cost_price}
              onChange={(e) => setField('cost_price', e.target.value)}
              onBlur={() => handleBlur('cost_price')}
              onKeyDown={handlePriceKeyDown}
              error={fieldErrors.cost_price}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Box>

          {/* Row 4: Barcode + Quantity */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput
              label="Barcode"
              value={form.barcode}
              onChange={(e) => setField('barcode', e.target.value)}
              error={fieldErrors.barcode}
            />
            <TextInput
              label="Stock Quantity"
              value={form.quantity}
              onChange={(e) => setField('quantity', e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
          </Box>

          {/* Image upload */}
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

          {/* is_active (edit only) */}
          {isEdit && (
            <FormControlLabel label="Active (visible on storefront)" control={
              <Switch checked={!!form.is_active}
                onChange={(e) => setField('is_active', e.target.checked)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1B4332' } }} />
            } />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" />
              : isEdit ? 'Save Changes' : 'Add Variant'}
          </Button>
        </Box>
      </Box>
    </Modal>
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
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Variant" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete variant <strong>{nameRef.current}</strong>? This action cannot be undone.
      </Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductVariantsPage() {
  const { can } = usePermissions();
  const canCreate = can('product_variant_create');
  const canEdit   = can('product_variant_edit');
  const canDelete = can('product_variant_delete');
  const canView   = can('product_variant_detail');
  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemId, setItemId]                 = useState(null);
  const [itemData, setItemData]             = useState(null);
  const [openAdd, setOpenAdd]               = useState(false);
  const [openEdit, setOpenEdit]             = useState(false);
  const [openView, setOpenView]             = useState(false);
  const [openDelete, setOpenDelete]         = useState(false);
  const [count, setCount]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [search, setSearch]                 = useState('');
  const [filterProduct, setFilterProduct]   = useState('');
  const [products, setProducts]             = useState([]);
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);

  // fetch products for toolbar filter
  useEffect(() => {
    apiPost('/admin/products/list', { page: 1, limit: 100 })
      .then((res) => setProducts(res?.data?.data ?? []))
      .catch(() => {});
  }, []);

  const getData = (searchVal = search, pageVal = pageValue, productVal = filterProduct, limitVal = limit) => {
    setIsTableLoading(true);
    const body = { page: pageVal + 1, limit: limitVal, search: searchVal.trim() };
    if (productVal) body.product_id = String(productVal);
    apiPost('/product-variants/list', body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    apiGet(`/product-variants/${id}`)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => { getData(); }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => {
        setOffset(0); setPageValue(0); getData(search, 0, filterProduct);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleProductFilter = (e) => {
    const val = e.target.value;
    setFilterProduct(val); setOffset(0); setPageValue(0); getData(search, 0, val);
  };

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit); setPageValue(newPage); getData(search, newPage, filterProduct);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, filterProduct, newLimit);
  };

  const handleOpenView   = (row) => { setItemId(row.id); setItemData(row); setOpenView(true);   getById(row.id); };
  const handleOpenEdit   = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true);   getById(row.id); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseView   = () => { setOpenView(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  const columns = [
    { key: '#',     label: '#',     width: 50,  render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'image', label: 'Image', width: 60,  render: (row) => <VariantThumb src={row.image} name={row.name} size={44} /> },
    { key: 'sku',   label: 'SKU',
      render: (row) => row.sku
        ? <Chip label={row.sku} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
        : <Typography variant="body2" color="text.disabled">—</Typography> },
    { key: 'name',    label: 'Name',    render: (row) => <Typography sx={{ fontWeight: 600 }}>{row.name}</Typography> },
    { key: 'product', label: 'Product', render: (row) => <Typography sx={{ fontSize: 13 }}>{row.product?.name || '—'}</Typography> },
    { key: 'weight',  label: 'Weight',  render: (row) => <Typography sx={{ fontSize: 13 }}>{row.weight ? `${row.weight} ${row.weight_unit || ''}`.trim() : '—'}</Typography> },
    { key: 'mrp',           label: 'MRP',           render: (row) => <Typography sx={{ fontSize: 13 }}>{formatPrice(row.mrp)}</Typography> },
    { key: 'selling_price', label: 'Selling Price',  render: (row) => <Typography sx={{ fontSize: 13 }}>{formatPrice(row.selling_price)}</Typography> },
    { key: 'quantity',      label: 'Stock',          render: (row) => <Typography sx={{ fontSize: 13 }}>{row.quantity ?? '—'}</Typography> },
    { key: 'status', label: 'Status', align: 'center',
      render: (row) => row.is_active
        ? <Chip label="Active"   size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
        : <Chip label="Inactive" size="small" sx={{ bgcolor: '#F5F5F5', color: '#57534E', fontWeight: 700 }} /> },
    { key: 'createdAt', label: 'Created', render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography> },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 130,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {canView && (
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleOpenView(row)} sx={{ color: '#0369A1' }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
          {canEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#1B4332' }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
          {canDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="product_variant_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Product Variants
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            label="Product"
            value={filterProduct}
            onChange={handleProductFilter}
            options={[
              { label: 'All Products', value: '' },
              ...products.map((p) => ({ label: p.name, value: p.id })),
            ]}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextInput
            size="small"
            placeholder="Search variants…"
            value={search}
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
          {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Variant
          </Button>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No variants found for "${search}"` : filterProduct ? 'No variants for this product' : 'No variants yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={1000}
      />

      {/* ── Modals ── */}
      <FormModal open={openAdd}  itemId={null}   itemData={null}
        onClose={handleCloseAdd}  onSaved={() => getData(search, pageValue, filterProduct)} />

      <FormModal open={openEdit} itemId={itemId} itemData={itemData}
        onClose={handleCloseEdit} onSaved={() => getData(search, pageValue, filterProduct)} />

      <ViewModal open={openView} itemData={itemData} onClose={handleCloseView} />

      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, filterProduct);
        }}
      />
    </AdminShell>
  );
}
