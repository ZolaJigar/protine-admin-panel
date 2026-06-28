/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Textarea, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Visibility,
  ImageNotSupported, CloudUpload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_LIMIT, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/constants/values';
import { dateFormat12, truncate, validateImageFile } from '@/utils/functions';

// ─── Local aliases ────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ACCEPTED_IMAGE_TYPES;
const MAX_FILE_SIZE  = MAX_IMAGE_SIZE;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = dateFormat12;

// ─── Image preview ────────────────────────────────────────────────────────────
function CategoryImage({ src, size = 40 }) {
  const [err, setErr] = useState(false);

  const wrapStyle = {
    width: size, height: size, borderRadius: 8, overflow: 'hidden',
    border: '1.5px solid #E7E5E4', bgcolor: '#F8FBF8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  if (!src || err) {
    return (
      <Box sx={wrapStyle}>
        <ImageNotSupported sx={{ fontSize: size * 0.45, color: '#C4BAB4' }} />
      </Box>
    );
  }
  return (
    <Box sx={wrapStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="category" onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </Box>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ open, itemData, onClose }) {
  const ref = useRef(itemData);
  if (itemData) ref.current = itemData;
  const item = ref.current;
  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title="Category Details" maxWidth="sm"
      actions={<Button variant="outlined" onClick={onClose}>Close</Button>}
    >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CategoryImage src={item.image} size={160} />
          </Box>
          {[
            { label: 'Name',        value: item.name },
            { label: 'Slug',        value: <Chip label={item.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /> },
            { label: 'Description', value: item.description || '—' },
            { label: 'Created At',  value: formatDate(item.createdAt) },
            { label: 'Updated At',  value: formatDate(item.updatedAt) },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', gap: 2 }}>
              <Typography component="div" sx={{ width: 110, fontWeight: 700, color: 'text.secondary', flexShrink: 0 }}>{label}</Typography>
              <Typography component="div" sx={{ flex: 1 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Modal>
  );
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  const [isLoading, setIsLoading]       = useState(false);
  const [form, setForm]                 = useState({ name: '', description: '' });
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});
  const [generalError, setGeneralError] = useState('');
  const fileInputRef                    = useRef();

  useEffect(() => {
    if (open) {
      if (isEdit && itemData) {
        setForm({ name: itemData.name || '', description: itemData.description || '' });
        setImagePreview(itemData.image || '');
      } else {
        setForm({ name: '', description: '' });
        setImagePreview('');
      }
      setImageFile(null);
      setFieldErrors({});
      setGeneralError('');
    }
  }, [open, isEdit, itemData]);

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
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

  const validateField = (key, val) => {
    switch (key) {
      case 'name': return !val.trim()      ? 'Name is required'
                        : val.length > 255 ? 'Name must be under 255 characters' : '';
      default:     return '';
    }
  };

  const handleBlur = (key) => {
    const val = form[key] ?? '';
    const msg = validateField(key, val);
    setFieldErrors((prev) => ({ ...prev, [key]: msg }));
  };

  const validate = () => {
    const errors = {};
    ['name'].forEach((key) => {
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
    fd.append('name', form.name.trim());
    fd.append('description', form.description.trim());
    if (imageFile) fd.append('image', imageFile);

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/admin/categories/update/${itemId}`, fd, {}, 'multipart/form-data')
        .then(() => { toast.success('Category updated successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/admin/categories/create', fd, {}, 'multipart/form-data')
        .then(() => { toast.success('Category created successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Category' : 'Add Category'} maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          <TextInput
            label="Name *"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={fieldErrors.name}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            error={fieldErrors.description}
            rows={3}
          />

          {/* Image upload */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Image (optional · JPEG/PNG/GIF/WebP · max 5 MB)
            </Typography>
            {imagePreview ? (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview"
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, display: 'block', border: '2px solid #E7E5E4' }} />
                <IconButton size="small" onClick={removeImage} aria-label="Remove image"
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#7F1D1D' }, width: 24, height: 24 }}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ) : (
              <Button variant="outlined" startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderStyle: 'dashed', borderColor: '#1B4332', color: '#1B4332', py: 1.5, px: 3 }}>
                Choose Image
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }} onChange={handleFileChange} />
            {fieldErrors.image && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{fieldErrors.image}</Typography>
            )}
            {imagePreview && (
              <Button size="small" variant="text" sx={{ mt: 1, color: '#1B4332' }}
                onClick={() => fileInputRef.current?.click()}>
                Change Image
              </Button>
            )}
          </Box>

          {isEdit && itemData?.slug && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Slug:</Typography>
              <Chip label={itemData.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
              <Typography variant="caption" color="text.disabled">(auto-updated if name changes)</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add Category'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemName, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef(itemName);
  if (itemName) nameRef.current = itemName;

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    apiDelete(`/admin/categories/delete/${itemId}`)
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Category" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete <strong>{nameRef.current}</strong>? This action cannot be undone.
      </Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { can } = usePermissions();
  const canCreate = can('category_create');
  const canEdit   = can('category_edit');
  const canDelete = can('category_delete');
  const canView   = can('category_detail');
  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
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
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);

  const getData = (searchVal = search, offsetVal = offset, pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    apiPost('/admin/categories/list', { page: pageVal + 1, limit: limitVal, search: searchVal.trim() })
      .then((res) => {
        const { count: total, data } = res.data;
        setTableData(data);
        setCount(total);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    setIsLoading(true);
    apiGet(`/admin/categories/${id}`)
      .then((res) => setItemData(res.data ?? res))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { getData(); }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0, 0); }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, 0, newLimit);
  };

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset);
    setPageValue(newPage);
    getData(search, newOffset, newPage);
  };

  const handleOpenEdit = (row) => {
    setItemId(row.id); setItemData(row); setOpenEdit(true); getById(row.id);
  };
  const handleOpenView = (row) => {
    setItemId(row.id); setItemData(row); setOpenView(true); getById(row.id);
  };
  const handleOpenDelete = (row) => {
    setItemId(row.id); setItemData(row); setOpenDelete(true);
  };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseView   = () => { setOpenView(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  // ── Table columns ──
  const columns = [
    { key: '#',          label: '#',           width: 50,  render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'image',      label: 'Image',       width: 64,  render: (row) => <CategoryImage src={row.image} size={40} /> },
    { key: 'name',       label: 'Name',                    render: (row) => <Typography sx={{ fontWeight: 700 }}>{row.name}</Typography> },
    { key: 'slug',       label: 'Slug',                    render: (row) => <Chip label={row.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 12 }} /> },
    { key: 'description',label: 'Description',             render: (row) => <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{truncate(row.description)}</Typography> },
    { key: 'createdAt',  label: 'Created',                 render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography> },
    {
      key: 'actions', label: 'Actions', width: 130, align: 'center',
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
    <AdminShell requiredPermission="category_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Categories
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextInput
            size="small"
            placeholder="Search by name or slug…"
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
            sx={{ width: 260 }}
          />
          {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Category
          </Button>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No categories found for "${search}"` : 'No categories yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={700}
      />

      {/* ── Modals ── */}
      <FormModal open={openAdd}  itemId={null}   itemData={null}   onClose={handleCloseAdd}    onSaved={() => getData(search, offset, pageValue)} />
      <FormModal open={openEdit} itemId={itemId} itemData={itemData} onClose={handleCloseEdit} onSaved={() => getData(search, offset, pageValue)} />
      <ViewModal open={openView} itemData={itemData} onClose={handleCloseView} />
      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name} onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, offset, pageValue);
        }}
      />
    </AdminShell>
  );
}
