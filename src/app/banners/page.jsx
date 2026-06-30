/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Textarea, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment, IconButton, Tooltip,
  Chip, Stack, Alert, CircularProgress, Switch, FormControlLabel, Avatar,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, ImageNotSupported,
  CloudUpload, Close, FilterAltOff,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { bannersAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import {
  DEFAULT_LIMIT,
  BANNER_PAGE_OPTIONS,
  BANNER_PAGE_COLORS,
} from '@/constants/values';
import { dateFormat12, validateImageFile } from '@/utils/functions';

// ─── Local aliases ────────────────────────────────────────────────────────────
const PAGE_OPTIONS = BANNER_PAGE_OPTIONS;
const PAGE_COLORS  = BANNER_PAGE_COLORS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = dateFormat12;

// ─── Banner thumbnail ─────────────────────────────────────────────────────────
function BannerThumb({ src, size = 72 }) {
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
    <img src={src} alt="banner" onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover',
        border: '1px solid #E7E5E4', display: 'block', flexShrink: 0 }} />
  );
}

// ─── Image upload field ───────────────────────────────────────────────────────
function ImageField({ label, required, file, preview, onFile, onRemove }) {
  const ref = useRef();
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
        {label}{required && ' *'} <Typography component="span" variant="caption" color="text.disabled">(JPEG/PNG/GIF/WebP · max 5 MB)</Typography>
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {preview ? (
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview"
              style={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 10,
                display: 'block', border: '2px solid #E7E5E4' }} />
            <IconButton size="small" onClick={onRemove} aria-label="Remove"
              sx={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20,
                bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#7F1D1D' } }}>
              <Close sx={{ fontSize: 11 }} />
            </IconButton>
          </Box>
        ) : (
          <Avatar variant="rounded" sx={{ width: 80, height: 52, bgcolor: '#F1F5F0',
            border: '2px dashed #D1D5DB', color: '#A8A29E', borderRadius: 2 }}>
            <ImageNotSupported />
          </Avatar>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button variant="outlined" size="small" startIcon={<CloudUpload />}
            onClick={() => ref.current?.click()}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
            {preview ? 'Change' : 'Upload'}
          </Button>
          {preview && (
            <Button variant="text" size="small" onClick={onRemove} sx={{ color: '#B91C1C' }}>Remove</Button>
          )}
        </Box>
      </Box>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const err = validateImageFile(f);
          if (err) { toast.error(err); return; }
          onFile(f);
          e.target.value = '';
        }} />
    </Box>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  const EMPTY = { title: '', description: '', page: '', is_active: true };

  const [isLoading, setIsLoading]         = useState(false);
  const [form, setForm]                   = useState(EMPTY);
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState('');
  const [mobileFile, setMobileFile]       = useState(null);
  const [mobilePreview, setMobilePreview] = useState('');
  const [fieldErrors, setFieldErrors]     = useState({});
  const [generalError, setGeneralError]   = useState('');

  useEffect(() => {
    if (!open) return;
    if (isEdit && itemData) {
      setForm({
        title:       itemData.title       || '',
        description: itemData.description || '',
        page:        itemData.page        || '',
        is_active:   itemData.is_active !== undefined ? !!itemData.is_active : true,
      });
      setImagePreview(itemData.image         || '');
      setMobilePreview(itemData.mobile_image || '');
    } else {
      setForm(EMPTY);
      setImagePreview('');
      setMobilePreview('');
    }
    setImageFile(null);
    setMobileFile(null);
    setFieldErrors({});
    setGeneralError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((p) => ({ ...p, [k]: '' }));
  };

  const validateField = (k, v) => {
    if (k === 'title')       return v.length > 255 ? 'Max 255 characters' : '';
    if (k === 'description') return v.length > 255 ? 'Max 255 characters' : '';
    return '';
  };

  const handleBlur = (k) => {
    const m = validateField(k, form[k] ?? '');
    if (m) setFieldErrors((p) => ({ ...p, [k]: m }));
  };

  const validate = () => {
    const errs = {};
    ['title', 'description'].forEach((k) => {
      const m = validateField(k, form[k] ?? '');
      if (m) errs[k] = m;
    });
    if (!isEdit && !imageFile) errs.image = 'Banner image is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    const fd = new FormData();
    fd.append('is_active', form.is_active ? 'true' : 'false');
    if (form.title.trim())       fd.append('title',        form.title.trim());
    if (form.description.trim()) fd.append('description',  form.description.trim());
    if (form.page)               fd.append('page',         form.page);
    if (imageFile)               fd.append('image',        imageFile);
    if (mobileFile)              fd.append('mobile_image', mobileFile);

    setIsLoading(true);
    const call = isEdit ? bannersAPI.update(itemId, fd) : bannersAPI.create(fd);
    call
      .then(() => { toast.success(isEdit ? 'Banner updated!' : 'Banner created!'); onSaved(); onClose(); })
      .catch((err) => {
        // Map field-level errors from data[].path[0] (Zod/validation responses)
        if (err?.data && Array.isArray(err.data)) {
          const mapped = {};
          err.data.forEach((e) => { if (e.path?.[0]) mapped[e.path[0]] = e.message; });
          if (Object.keys(mapped).length) { setFieldErrors(mapped); return; }
        }
        setGeneralError(typeof err === 'string' ? err : 'Something went wrong.');
        toast.error(typeof err === 'string' ? err : 'Something went wrong.');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Banner' : 'Add Banner'} maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          {/* Row 1: Title + Page */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput label="Title" value={form.title}
              onChange={(e) => setField('title', e.target.value)} onBlur={() => handleBlur('title')}
              error={fieldErrors.title} />
            <Select label="Page" value={form.page}
              onChange={(e) => setField('page', e.target.value)}
              options={PAGE_OPTIONS}
              error={fieldErrors.page} fullWidth />
          </Box>

          {/* Description */}
          <Textarea label="Description" value={form.description}
            onChange={(e) => setField('description', e.target.value)} onBlur={() => handleBlur('description')}
            error={fieldErrors.description} rows={2} />

          {/* Active toggle */}
          <FormControlLabel label="Active" control={
            <Switch checked={!!form.is_active} onChange={(e) => setField('is_active', e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1B4332' } }} />
          } />

          {/* Images */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <ImageField label="Desktop Image" required={!isEdit}
                file={imageFile} preview={imagePreview}
                onFile={(f) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); if (fieldErrors.image) setFieldErrors((p) => ({ ...p, image: '' })); }}
                onRemove={() => { setImageFile(null); setImagePreview(''); }} />
              {fieldErrors.image && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{fieldErrors.image}</Typography>}
            </Box>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <ImageField label="Mobile Image" required={false}
                file={mobileFile} preview={mobilePreview}
                onFile={(f) => { setMobileFile(f); setMobilePreview(URL.createObjectURL(f)); }}
                onRemove={() => { setMobileFile(null); setMobilePreview(''); }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add Banner'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemTitle, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef(itemTitle);
  if (itemTitle) ref.current = itemTitle;

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    bannersAPI.delete(itemId)
      .then(() => { toast.success(`"${ref.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Delete failed.'))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Banner" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete <strong>{ref.current}</strong>? This cannot be undone.
      </Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BannersPage() {
  const { can } = usePermissions();
  const canCreate = can('banner_create');
  const canEdit   = can('banner_edit');
  const canDelete = can('banner_delete');

  const [tableData,      setTableData]      = useState([]);
  const [count,          setCount]          = useState(0);
  const [pageValue,      setPageValue]      = useState(0);
  const [limit,          setLimit]          = useState(DEFAULT_LIMIT);
  const [offset,         setOffset]         = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [search,         setSearch]         = useState('');
  const [isSearch,       setIsSearch]       = useState(false);
  const [filterPage,     setFilterPage]     = useState('');
  const [togglingId,     setTogglingId]     = useState(null);

  const [itemId,       setItemId]       = useState(null);
  const [itemData,     setItemData]     = useState(null);
  const [openAdd,      setOpenAdd]      = useState(false);
  const [openEdit,     setOpenEdit]     = useState(false);
  const [openDelete,   setOpenDelete]   = useState(false);

  const getData = (
    searchVal = search, pageVal = pageValue, limitVal = limit, pageFilter = filterPage,
  ) => {
    setIsTableLoading(true);
    const body = { page_number: pageVal + 1, limit: limitVal };
    if (searchVal.trim()) body.search = searchVal.trim();
    if (pageFilter)       body.page   = pageFilter;
    bannersAPI.list(body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to load banners.'))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    bannersAPI.getById(id)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => { getData(); }, []);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSearch) return;
    const t = setTimeout(() => { setOffset(0); setPageValue(0); getData(search, 0, limit, filterPage); }, 300);
    return () => clearTimeout(t);
  }, [search]);// eslint-disable-line react-hooks/exhaustive-deps

  const handlePageFilter = (val) => {
    setFilterPage(val); setOffset(0); setPageValue(0); getData(search, 0, limit, val);
  };

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit); setPageValue(newPage); getData(search, newPage, limit, filterPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit); setOffset(0); setPageValue(0); getData(search, 0, newLimit, filterPage);
  };

  const handleClearFilters = () => {
    setSearch(''); setFilterPage(''); setOffset(0); setPageValue(0); getData('', 0, limit, '');
  };

  const handleToggleStatus = (row) => {
    setTogglingId(row.id);
    bannersAPI.toggleStatus(row.id, { is_active: !row.is_active })
      .then(() => {
        setTableData((prev) => prev.map((b) => b.id === row.id ? { ...b, is_active: !row.is_active } : b));
        toast.success(`Banner ${!row.is_active ? 'activated' : 'deactivated'}.`);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Status update failed.'))
      .finally(() => setTogglingId(null));
  };

  const handleOpenEdit   = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true);  getById(row.id); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  const hasFilters = search || filterPage;

  const columns = [
    { key: '#', label: '#', width: 50,
      render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'image', label: 'Desktop Image', width: 90,
      render: (row) => <BannerThumb src={row.image} size={72} /> },
    { key: 'title', label: 'Title',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{row.title}</Typography>
          {row.description && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
              {row.description.length > 60 ? row.description.slice(0, 60) + '…' : row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    { key: 'page', label: 'Page', align: 'center',
      render: (row) => {
        const c = PAGE_COLORS[row.page] ?? { bg: '#F1F5F9', color: '#475569' };
        return <Chip label={row.page} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, textTransform: 'capitalize' }} />;
      },
    },
    { key: 'is_active', label: 'Status', align: 'center',
      render: (row) => (
        <Tooltip title={row.is_active ? 'Click to deactivate' : 'Click to activate'}>
          <span>
            <Switch
              size="small"
              checked={!!row.is_active}
              disabled={togglingId === row.id || !canEdit}
              onChange={() => handleToggleStatus(row)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1B4332' } }}
            />
          </span>
        </Tooltip>
      ),
    },
    { key: 'createdAt', label: 'Created',
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography> },
    { key: 'actions', label: 'Actions', align: 'center', width: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
    <AdminShell requiredPermission="banner_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Banners
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextInput size="small" placeholder="Search title or description…" value={search}
            onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }}
            sx={{ width: 240 }} />
          <Select label="Page" value={filterPage} onChange={(e) => handlePageFilter(e.target.value)}
            options={PAGE_OPTIONS} size="small" sx={{ minWidth: 140 }} />
          {hasFilters && (
            <Tooltip title="Clear filters">
              <IconButton size="small" onClick={handleClearFilters}
                sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', '&:hover': { bgcolor: '#FECACA' } }}>
                <FilterAltOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
              sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
              Add Banner
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table columns={columns} rows={tableData} loading={isTableLoading}
        emptyMessage={hasFilters ? 'No banners match your filters' : 'No banners yet'}
        count={count} page={pageValue} rowsPerPage={limit}
        onPageChange={handleTableChange} onRowsPerPageChange={handleLimitChange} minWidth={800} />

      {/* ── Modals ── */}
      {canCreate && (
        <FormModal open={openAdd} itemId={null} itemData={null}
          onClose={handleCloseAdd} onSaved={() => getData(search, pageValue, limit, filterPage)} />
      )}
      {canEdit && (
        <FormModal open={openEdit} itemId={itemId} itemData={itemData}
          onClose={handleCloseEdit} onSaved={() => getData(search, pageValue, limit, filterPage)} />
      )}
      <DeleteModal open={openDelete} itemId={itemId} itemTitle={itemData?.title}
        onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(search, pageValue, limit, filterPage);
        }} />
    </AdminShell>
  );
}
