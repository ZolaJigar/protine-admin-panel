/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { TextInput, Textarea, Select, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
  Avatar, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Visibility,
  ImageNotSupported, OpenInNew, ViewModule, AddPhotoAlternate,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT  = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE  = 5 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncate(str, n = 60) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function nameToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, GIF, or WebP allowed.';
  if (file.size > MAX_FILE_SIZE) return 'Image must be under 5 MB.';
  return null;
}

// ─── Product thumbnail ────────────────────────────────────────────────────────
function ProductThumb({ src, name, size = 44 }) {
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
function ViewModal({ open, itemData, onClose, onEdit }) {
  const router = useRouter();
  const ref    = useRef(itemData);
  if (itemData) ref.current = itemData;
  const item = ref.current;
  if (!item) return null;

  // Combine primary image + images array for gallery display
  const allImages = [
    ...(item.image ? [item.image] : []),
    ...(Array.isArray(item.images) ? item.images.map((img) => (typeof img === 'string' ? img : img.url ?? img.path ?? '')) : []),
  ].filter(Boolean);

  return (
    <Modal open={open} onClose={onClose} title="Product Details" maxWidth="md"
      actions={<>
        <Button variant="outlined" startIcon={<ViewModule />}
          onClick={() => { onClose(); router.push(`/products/${item.id}/variants`); }}>
          Manage Variants
        </Button>
        <Button variant="outlined" onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => { onClose(); onEdit(); }}
          sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
          Edit Product
        </Button>
      </>}
    >
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Image gallery */}
          <Box sx={{ flexShrink: 0 }}>
            {allImages.length > 0 ? (
              <Box>
                {/* Primary / large image */}
                <ProductThumb src={allImages[0]} name={item.name} size={160} />
                {/* Thumbnails row */}
                {allImages.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', maxWidth: 160 }}>
                    {allImages.slice(1).map((src, i) => (
                      <ProductThumb key={i} src={src} name={`${item.name} ${i + 2}`} size={48} />
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <ProductThumb src={null} name={item.name} size={160} />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              { label: 'Name',     value: <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography> },
              { label: 'Slug',     value: <Chip label={item.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /> },
              { label: 'Category', value: <Chip label={item.category?.name || '—'} size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332' }} /> },
              { label: 'Status',   value: item.is_active
                  ? <Chip label="Active"   size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
                  : <Chip label="Inactive" size="small" sx={{ bgcolor: '#F5F5F5', color: '#57534E', fontWeight: 700 }} /> },
              { label: 'Images',   value: <Typography variant="body2" color="text.secondary">{allImages.length} image{allImages.length !== 1 ? 's' : ''}</Typography> },
              { label: 'Created',  value: <Typography variant="body2" color="text.secondary">{formatDate(item.createdAt)}</Typography> },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography component="div" sx={{ width: 100, fontWeight: 700, color: 'text.secondary', flexShrink: 0, fontSize: 14 }}>{label}</Typography>
                <Box component="div" sx={{ flex: 1 }}>{value}</Box>
              </Box>
            ))}
            {item.video && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography component="div" sx={{ width: 100, fontWeight: 700, color: 'text.secondary', flexShrink: 0, fontSize: 14 }}>Video</Typography>
                <Button size="small" endIcon={<OpenInNew />} href={item.video} target="_blank" rel="noreferrer"
                  sx={{ color: '#0369A1', textTransform: 'none', p: 0 }}>
                  Open Link
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        {item.short_description && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.secondary' }}>Short Description</Typography>
            <Typography variant="body2">{item.short_description}</Typography>
          </Box>
        )}
        {item.long_description && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.secondary' }}>Long Description</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{item.long_description}</Typography>
          </Box>
        )}
    </Modal>
  );
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  const [isLoading, setIsLoading]       = useState(false);
  const [categories, setCategories]     = useState([]);
  const [catsLoading, setCatsLoading]   = useState(false);
  const [form, setForm]                 = useState({
    name: '', category_id: '', short_description: '',
    long_description: '', video: '', is_active: true,
  });
  // Multiple extra images
  const [imageFiles, setImageFiles]     = useState([]);   // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // { url, isExisting }[]
  const [fieldErrors, setFieldErrors]   = useState({});
  const [generalError, setGeneralError] = useState('');
  const fileInputRef                    = useRef();

  useEffect(() => {
    if (open) {
      setCatsLoading(true);
      apiPost('/admin/categories/list', { page: 1, limit: 100 })
        .then((res) => setCategories(res?.data?.data ?? res?.data ?? []))
        .catch(() => setCategories([]))
        .finally(() => setCatsLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (isEdit && itemData) {
        setForm({
          name:              itemData.name              || '',
          category_id:       itemData.category_id       || '',
          short_description: itemData.short_description || '',
          long_description:  itemData.long_description  || '',
          video:             itemData.video             || '',
          is_active:         itemData.is_active !== undefined ? itemData.is_active : true,
        });
        // Pre-populate existing images from API
        const existing = [
          ...(itemData.image ? [itemData.image] : []),
          ...(Array.isArray(itemData.images)
            ? itemData.images.map((img) => (typeof img === 'string' ? img : img.url ?? img.path ?? ''))
            : []),
        ].filter(Boolean);
        setImagePreviews(existing.map((url) => ({ url, isExisting: true })));
      } else {
        setForm({ name: '', category_id: '', short_description: '', long_description: '', video: '', is_active: true });
        setImagePreviews([]);
      }
      setImageFiles([]);
      setFieldErrors({});
      setGeneralError('');
    }
  }, [open, isEdit, itemData]);

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: '' }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const valid = [];
    for (const file of files) {
      const err = validateImageFile(file);
      if (err) { toast.error(`${file.name}: ${err}`); continue; }
      valid.push(file);
    }
    if (!valid.length) return;
    setImageFiles((prev) => [...prev, ...valid]);
    setImagePreviews((prev) => [
      ...prev,
      ...valid.map((f) => ({ url: URL.createObjectURL(f), isExisting: false })),
    ]);
    // Reset input so same file can be re-picked
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx) => {
    const preview = imagePreviews[idx];
    if (!preview.isExisting) {
      // Count how many new-file previews come before this index
      const newIdx = imagePreviews.slice(0, idx).filter((p) => !p.isExisting).length;
      setImageFiles((prev) => prev.filter((_, i) => i !== newIdx));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateField = (key, val) => {
    switch (key) {
      case 'category_id': return !val                    ? 'Category is required'          : '';
      case 'name':        return !val.trim()             ? 'Name is required'
                               : val.length > 255        ? 'Max 255 characters'            : '';
      case 'video':       return val && val.length > 255 ? 'Max 255 characters'            : '';
      default:            return '';
    }
  };

  const handleBlur = (key) => {
    const val = form[key] ?? '';
    const msg = validateField(key, val);
    setFieldErrors((prev) => ({ ...prev, [key]: msg }));
  };

  const validate = () => {
    const errors = {};
    ['category_id', 'name', 'video'].forEach((key) => {
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
      fd.append('category_id',       form.category_id);
      fd.append('name',              form.name.trim());
      fd.append('short_description', form.short_description ?? '');
      fd.append('long_description',  form.long_description  ?? '');
      fd.append('video',             form.video             ?? '');
      fd.append('is_active',         form.is_active ? 1 : 0);
    } else {
      fd.append('category_id', form.category_id);
      fd.append('name',        form.name.trim());
      if (form.short_description) fd.append('short_description', form.short_description);
      if (form.long_description)  fd.append('long_description',  form.long_description);
      if (form.video)             fd.append('video',             form.video);
    }
    // Append all new image files
    imageFiles.forEach((f) => fd.append('images', f));

    setIsLoading(true);
    const apiCall = isEdit
      ? apiPut(`/admin/products/update/${itemId}`, fd, {}, 'multipart/form-data')
      : apiPost('/admin/products/create', fd, {}, 'multipart/form-data');

    apiCall
      .then(() => {
        toast.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
        onSaved();
        onClose();
      })
      .catch((err) => { setGeneralError(err); toast.error(err); })
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          {/* Row 1: Category + Name */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Select
              label="Category *"
              value={form.category_id}
              onChange={(e) => setField('category_id', e.target.value)}
              onBlur={() => handleBlur('category_id')}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              error={fieldErrors.category_id}
              disabled={catsLoading}
              required
              fullWidth
            />
            <TextInput
              label="Product Name *"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={fieldErrors.name}
              required
            />
          </Box>

          {/* Slug preview */}
          {form.name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: -1.5 }}>
              <Typography variant="caption" color="text.secondary">Slug preview:</Typography>
              <Chip label={nameToSlug(form.name)} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
            </Box>
          )}

          {/* Short Description */}
          <Textarea
            label="Short Description"
            value={form.short_description}
            onChange={(e) => setField('short_description', e.target.value)}
            rows={2}
          />

          {/* Long Description */}
          <Textarea
            label="Long Description"
            value={form.long_description}
            onChange={(e) => setField('long_description', e.target.value)}
            rows={5}
          />

          {/* Video URL */}
          <TextInput
            label="Video URL"
            placeholder="https://youtube.com/watch?v=..."
            value={form.video}
            onChange={(e) => setField('video', e.target.value)}
            onBlur={() => handleBlur('video')}
            error={fieldErrors.video}
          />

          {/* Multiple image upload */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Product Images (optional · JPEG/PNG/GIF/WebP · max 5 MB each)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddPhotoAlternate />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderColor: '#1B4332', color: '#1B4332' }}
              >
                Add Images
              </Button>
            </Box>

            {/* Image grid */}
            {imagePreviews.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {imagePreviews.map((preview, idx) => (
                  <Box key={idx} sx={{ position: 'relative', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.url}
                      alt={`product-${idx + 1}`}
                      style={{
                        width: 90, height: 90, objectFit: 'cover',
                        borderRadius: 10, display: 'block',
                        border: idx === 0 ? '2px solid #1B4332' : '2px solid #E7E5E4',
                      }}
                    />
                    {idx === 0 && (
                      <Box sx={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        bgcolor: 'rgba(27,67,50,0.75)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                        py: 0.25, textAlign: 'center',
                      }}>
                        <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>PRIMARY</Typography>
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeImage(idx)}
                      aria-label="Remove image"
                      sx={{
                        position: 'absolute', top: -7, right: -7,
                        width: 20, height: 20, bgcolor: '#B91C1C', color: '#fff',
                        '&:hover': { bgcolor: '#7F1D1D' },
                      }}
                    >
                      <Close sx={{ fontSize: 11 }} />
                    </IconButton>
                  </Box>
                ))}

                {/* Add more tile */}
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    width: 90, height: 90, borderRadius: '10px',
                    border: '2px dashed #D1D5DB', bgcolor: '#F9FAFB',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#9CA3AF',
                    '&:hover': { bgcolor: '#F1F5F0', borderColor: '#1B4332', color: '#1B4332' },
                  }}
                >
                  <AddPhotoAlternate sx={{ fontSize: 22, mb: 0.25 }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 600 }}>Add</Typography>
                </Box>
              </Box>
            ) : (
              /* Empty state — click to upload */
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  p: 2, borderRadius: 2, border: '2px dashed #D1D5DB',
                  bgcolor: '#F9FAFB', cursor: 'pointer',
                  '&:hover': { bgcolor: '#F1F5F0', borderColor: '#1B4332' },
                }}
              >
                <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#F1F5F0', color: '#A8A29E' }}>
                  <ImageNotSupported />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Click to upload images</Typography>
                  <Typography variant="caption" color="text.disabled">JPEG, PNG, GIF, WebP · up to 5 MB each · multiple allowed</Typography>
                </Box>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </Box>

          {/* is_active toggle (edit only) */}
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
              : isEdit ? 'Save Changes' : 'Add Product'}
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
    apiDelete(`/admin/products/delete/${itemId}`)
      .then(() => {
        toast.success(`"${nameRef.current}" deleted.`);
        onDeleted();
        onClose();
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Product" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete <strong>{nameRef.current}</strong>?
      </Typography>
      <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>
        This will also affect product variants linked to this product.
      </Alert>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can('product_create');
  const canEdit   = can('product_edit');
  const canDelete = can('product_delete');
  const canView   = can('product_detail');

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
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories]         = useState([]);
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);

  const getData = (searchVal = search, pageVal = pageValue, categoryVal = filterCategory, limitVal = limit) => {
    setIsTableLoading(true);
    const body = { page: pageVal + 1, limit: limitVal, search: searchVal.trim() };
    if (categoryVal) body.category_id = String(categoryVal);
    apiPost('/admin/products/list', body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getCategories = () => {
    apiPost('/admin/categories/list', { page: 1, limit: 100 })
      .then((res) => setCategories(res?.data?.data ?? res?.data ?? []))
      .catch(() => {});
  };

  const getById = (id) => {
    apiGet(`/admin/products/${id}`)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => {
    getCategories();
    getData();
  }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => {
        setOffset(0);
        setPageValue(0);
        getData(search, 0, filterCategory);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleCategoryFilter = (val) => {
    setFilterCategory(val);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, val);
  };

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit);
    setPageValue(newPage);
    getData(search, newPage, filterCategory);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, filterCategory, newLimit);
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

  // ─── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (row, idx) => (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: 13 }}>
          {offset + idx + 1}
        </Typography>
      ),
    },
    {
      key: 'name', label: 'Name',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      key: 'category', label: 'Category',
      render: (row) => (
        <Chip label={row.category?.name || '—'} size="small"
          sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />
      ),
    },
    {
      key: 'description', label: 'Description',
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, maxWidth: 200 }}>
          {truncate(row.short_description)}
        </Typography>
      ),
    },
    {
      key: 'status', label: 'Status', align: 'center',
      render: (row) => row.is_active
        ? <Chip label="Active"   size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
        : <Chip label="Inactive" size="small" sx={{ bgcolor: '#F5F5F5', color: '#57534E', fontWeight: 700 }} />,
    },
    {
      key: 'createdAt', label: 'Created',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 150,
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
    <AdminShell requiredPermission="product_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Products
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Category filter */}
          <Select
            label="Category"
            value={filterCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            options={[
              { label: 'All Categories', value: '' },
              ...categories.map((c) => ({ label: c.name, value: c.id })),
            ]}
            size="small"
            sx={{ minWidth: 180 }}
          />

          {/* Search */}
          <TextInput
            size="small"
            placeholder="Search products…"
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
            Add Product
          </Button>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={
          search ? `No products found for "${search}"`
            : filterCategory ? 'No products in this category'
            : 'No products yet'
        }
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={850}
      />

      {/* ── Modals ── */}
      {canCreate && (
      <FormModal open={openAdd} itemId={null} itemData={null}
        onClose={handleCloseAdd}
        onSaved={() => getData(search, pageValue, filterCategory)} />
      )}
      {canEdit && (
      <FormModal open={openEdit} itemId={itemId} itemData={itemData}
        onClose={handleCloseEdit}
        onSaved={() => getData(search, pageValue, filterCategory)} />
      )}

      <ViewModal
        open={openView} itemData={itemData} onClose={handleCloseView}
        onEdit={() => handleOpenEdit(itemData)} />

      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) {
            handleTableChange(pageValue - 1);
          } else {
            getData(search, pageValue, filterCategory);
          }
        }}
      />
    </AdminShell>
  );
}
