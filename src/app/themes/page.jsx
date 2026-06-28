/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, IconButton, Tooltip,
  Chip, Stack, Alert, CircularProgress, Avatar,
} from '@mui/material';
import { Add, Edit, Delete, ImageNotSupported, CloudUpload, Close } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { themesAPI } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT  = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/svg+xml'];
const MAX_FILE_SIZE  = 5 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only image files are allowed (JPEG, PNG, GIF, WebP, SVG, ICO).';
  if (file.size > MAX_FILE_SIZE) return 'Image must be under 5 MB.';
  return null;
}

// ─── Color swatch cell ────────────────────────────────────────────────────────
function ColorSwatch({ value }) {
  if (!value) return <Typography variant="body2" color="text.disabled">—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 24, height: 24, borderRadius: 1, flexShrink: 0,
        background: value, border: '1.5px solid rgba(0,0,0,0.12)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{value}</Typography>
    </Box>
  );
}

// ─── Small image thumbnail ────────────────────────────────────────────────────
function ImgThumb({ src, size = 40 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <Avatar variant="rounded" sx={{ width: size, height: size, bgcolor: '#F1F5F0', color: '#A8A29E' }}>
        <ImageNotSupported sx={{ fontSize: size * 0.45 }} />
      </Avatar>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt="" onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'contain',
        border: '1px solid #E7E5E4', display: 'block', background: '#F8FBF8' }} />
  );
}

// ─── Single image upload field ────────────────────────────────────────────────
function ImageUploadField({ label, file, preview, onFile, onRemove, accept }) {
  const ref = useRef();
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'text.secondary', fontSize: 13 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {preview ? (
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview"
              style={{ width: 80, height: 56, objectFit: 'contain', borderRadius: 8,
                border: '2px solid #E7E5E4', background: '#F8FBF8', display: 'block' }} />
            <IconButton size="small" onClick={onRemove} aria-label="Remove"
              sx={{ position: 'absolute', top: -7, right: -7, width: 18, height: 18,
                bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#7F1D1D' } }}>
              <Close sx={{ fontSize: 10 }} />
            </IconButton>
          </Box>
        ) : (
          <Avatar variant="rounded" sx={{ width: 56, height: 40, bgcolor: '#F1F5F0',
            border: '2px dashed #D1D5DB', color: '#A8A29E', borderRadius: 1.5 }}>
            <ImageNotSupported sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        <Button variant="outlined" size="small" startIcon={<CloudUpload />}
          onClick={() => ref.current?.click()}
          sx={{ borderColor: '#1B4332', color: '#1B4332', fontSize: 12, py: 0.5 }}>
          {preview ? 'Change' : 'Upload'}
        </Button>
      </Box>
      <input ref={ref} type="file"
        accept={accept ?? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/x-icon'}
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

// ─── Color input (text + native color picker) ─────────────────────────────────
function ColorInput({ label, required, value, onChange, onBlur, error }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'text.secondary', fontSize: 13 }}>
        {label}{required && ' *'}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Native color picker as swatch */}
        <Box sx={{ position: 'relative', width: 36, height: 36, borderRadius: 1,
          border: '1.5px solid #D1D5DB', overflow: 'hidden', flexShrink: 0,
          background: value || '#ffffff', cursor: 'pointer' }}>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{3,6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '200%', height: '200%',
              opacity: 0, cursor: 'pointer', border: 'none' }}
          />
        </Box>
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          error={error}
          placeholder="#FF5733 or red"
          size="small"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
      </Box>
      {error && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{error}</Typography>}
    </Box>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;
  const EMPTY  = { primary: '', secondary: '', third: '' };

  const [isLoading,   setIsLoading]   = useState(false);
  const [form,        setForm]        = useState(EMPTY);
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviFile,    setFaviFile]    = useState(null);
  const [faviPreview, setFaviPreview] = useState('');
  const [thumbFile,   setThumbFile]   = useState(null);
  const [thumbPreview,setThumbPreview]= useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError,setGeneralError]= useState('');

  useEffect(() => {
    if (!open) return;
    if (isEdit && itemData) {
      setForm({ primary: itemData.primary || '', secondary: itemData.secondary || '', third: itemData.third || '' });
      setLogoPreview(itemData.logo       || '');
      setFaviPreview(itemData.favicon    || '');
      setThumbPreview(itemData.thumb_nail || '');
    } else {
      setForm(EMPTY);
      setLogoPreview(''); setFaviPreview(''); setThumbPreview('');
    }
    setLogoFile(null); setFaviFile(null); setThumbFile(null);
    setFieldErrors({}); setGeneralError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (k, v) => { setForm((p) => ({ ...p, [k]: v })); if (fieldErrors[k]) setFieldErrors((p) => ({ ...p, [k]: '' })); };

  const validateField = (k, v) => {
    if (k === 'primary')   return !v.trim() ? 'Primary color is required'   : v.length > 100 ? 'Max 100 characters' : '';
    if (k === 'secondary') return !v.trim() ? 'Secondary color is required' : v.length > 100 ? 'Max 100 characters' : '';
    if (k === 'third')     return v.length > 100 ? 'Max 100 characters' : '';
    return '';
  };

  const handleBlur = (k) => { const m = validateField(k, form[k] ?? ''); if (m) setFieldErrors((p) => ({ ...p, [k]: m })); };

  const validate = () => {
    const errs = {};
    ['primary', 'secondary', 'third'].forEach((k) => { const m = validateField(k, form[k] ?? ''); if (m) errs[k] = m; });
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    const fd = new FormData();
    fd.append('primary',   form.primary.trim());
    fd.append('secondary', form.secondary.trim());
    if (form.third) fd.append('third', form.third.trim());
    if (logoFile)  fd.append('logo',       logoFile);
    if (faviFile)  fd.append('favicon',    faviFile);
    if (thumbFile) fd.append('thumb_nail', thumbFile);

    setIsLoading(true);
    const call = isEdit ? themesAPI.update(itemId, fd) : themesAPI.create(fd);
    call
      .then(() => { toast.success(isEdit ? 'Theme updated!' : 'Theme created!'); onSaved(); onClose(); })
      .catch((err) => {
        if (err?.data && Array.isArray(err.data)) {
          const mapped = {};
          err.data.forEach((e) => { if (e.path?.[0]) mapped[e.path[0]] = e.message; });
          if (Object.keys(mapped).length) { setFieldErrors(mapped); return; }
        }
        const msg = typeof err === 'string' ? err : 'Something went wrong.';
        setGeneralError(msg); toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Theme' : 'Add Theme'} maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          {/* Color row */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <ColorInput label="Primary Color" required value={form.primary}
              onChange={(v) => setField('primary', v)} onBlur={() => handleBlur('primary')} error={fieldErrors.primary} />
            <ColorInput label="Secondary Color" required value={form.secondary}
              onChange={(v) => setField('secondary', v)} onBlur={() => handleBlur('secondary')} error={fieldErrors.secondary} />
            <ColorInput label="Third / Accent Color" value={form.third}
              onChange={(v) => setField('third', v)} onBlur={() => handleBlur('third')} error={fieldErrors.third} />
          </Box>

          {/* Image uploads */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <ImageUploadField label="Logo (optional)"
              file={logoFile} preview={logoPreview}
              onFile={(f) => { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }}
              onRemove={() => { setLogoFile(null); setLogoPreview(''); }} />
            <ImageUploadField label="Favicon (optional)"
              file={faviFile} preview={faviPreview}
              onFile={(f) => { setFaviFile(f); setFaviPreview(URL.createObjectURL(f)); }}
              onRemove={() => { setFaviFile(null); setFaviPreview(''); }} />
            <ImageUploadField label="Thumbnail (optional)"
              file={thumbFile} preview={thumbPreview}
              onFile={(f) => { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }}
              onRemove={() => { setThumbFile(null); setThumbPreview(''); }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add Theme'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    themesAPI.delete(itemId)
      .then(() => { toast.success('Theme deleted.'); onDeleted(); onClose(); })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Delete failed.'))
      .finally(() => setIsLoading(false));
  };
  return (
    <Modal open={open} onClose={onClose} title="Delete Theme" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>Are you sure you want to delete this theme? This cannot be undone.</Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ThemesPage() {
  const { can }   = usePermissions();
  const canCreate = can('theme_create');
  const canEdit   = can('theme_edit');
  const canDelete = can('theme_delete');

  const [tableData,      setTableData]      = useState([]);
  const [count,          setCount]          = useState(0);
  const [pageValue,      setPageValue]      = useState(0);
  const [limit,          setLimit]          = useState(DEFAULT_LIMIT);
  const [offset,         setOffset]         = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemId,         setItemId]         = useState(null);
  const [itemData,       setItemData]       = useState(null);
  const [openAdd,        setOpenAdd]        = useState(false);
  const [openEdit,       setOpenEdit]       = useState(false);
  const [openDelete,     setOpenDelete]     = useState(false);

  const getData = (pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    themesAPI.list({ page_number: pageVal + 1, limit: limitVal })
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to load themes.'))
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    themesAPI.getById(id)
      .then((res) => setItemData(res?.data ?? res))
      .catch(() => {});
  };

  useEffect(() => { getData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (newPage) => { setOffset(newPage * limit); setPageValue(newPage); getData(newPage, limit); };
  const handleLimitChange = (newLimit) => { setLimit(newLimit); setOffset(0); setPageValue(0); getData(0, newLimit); };
  const handleOpenEdit    = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true); getById(row.id); };
  const handleOpenDelete  = (row) => { setItemId(row.id); setOpenDelete(true); };
  const handleCloseAdd    = () => setOpenAdd(false);
  const handleCloseEdit   = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); };

  const columns = [
    { key: '#', label: '#', width: 50,
      render: (_, idx) => <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography> },
    { key: 'logo', label: 'Logo', width: 70,
      render: (row) => <ImgThumb src={row.logo} size={44} /> },
    { key: 'primary', label: 'Primary',
      render: (row) => <ColorSwatch value={row.primary} /> },
    { key: 'secondary', label: 'Secondary',
      render: (row) => <ColorSwatch value={row.secondary} /> },
    { key: 'third', label: 'Third / Accent',
      render: (row) => <ColorSwatch value={row.third} /> },
    { key: 'assets', label: 'Assets', align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.75} justifyContent="center">
          {row.favicon    && <Tooltip title="Favicon"><ImgThumb src={row.favicon}    size={28} /></Tooltip>}
          {row.thumb_nail && <Tooltip title="Thumbnail"><ImgThumb src={row.thumb_nail} size={28} /></Tooltip>}
          {!row.favicon && !row.thumb_nail && <Typography variant="caption" color="text.disabled">—</Typography>}
        </Stack>
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
    <AdminShell requiredPermission="theme_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Themes
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Theme
          </Button>
        )}
      </Box>

      {/* ── Table ── */}
      <Table columns={columns} rows={tableData} loading={isTableLoading}
        emptyMessage="No themes yet"
        count={count} page={pageValue} rowsPerPage={limit}
        onPageChange={handleTableChange} onRowsPerPageChange={handleLimitChange}
        minWidth={780} />

      {/* ── Modals ── */}
      {canCreate && (
        <FormModal open={openAdd} itemId={null} itemData={null}
          onClose={handleCloseAdd} onSaved={() => getData(pageValue, limit)} />
      )}
      {canEdit && (
        <FormModal open={openEdit} itemId={itemId} itemData={itemData}
          onClose={handleCloseEdit} onSaved={() => getData(pageValue, limit)} />
      )}
      <DeleteModal open={openDelete} itemId={itemId} onClose={handleCloseDelete}
        onDeleted={() => {
          if (tableData.length === 1 && pageValue > 0) handleTableChange(pageValue - 1);
          else getData(pageValue, limit);
        }} />
    </AdminShell>
  );
}
