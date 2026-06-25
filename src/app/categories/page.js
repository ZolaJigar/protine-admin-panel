/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Chip, Skeleton, Stack, Alert, CircularProgress, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Visibility,
  ImageNotSupported, CloudUpload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE  = 5 * 1024 * 1024; // 5 MB
const limit          = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, GIF, or WebP images are allowed.';
  if (file.size > MAX_FILE_SIZE) return 'Image must be under 5 MB.';
  return null;
}

function truncate(str, n = 60) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <TableRow>
      <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          {search ? `No categories found for "${search}"` : 'No categories yet'}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {search ? 'Try a different search term.' : 'Click "Add Category" to create your first one.'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

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
      <img
        src={src}
        alt="category"
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </Box>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ open, itemData, onClose }) {
  // stable ref so MUI close animation doesn't lose data
  const ref = useRef(itemData);
  if (itemData) ref.current = itemData;
  const item = ref.current;

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Category Details
        <IconButton onClick={onClose} size="small" aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  // state
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

  const validate = () => {
    const errors = {};
    if (!form.name.trim())           errors.name = 'Name is required';
    else if (form.name.length > 255) errors.name = 'Name must be under 255 characters';
    return errors;
  };

  // api calls
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
      apiPut(`/categories/update/${itemId}`, fd, {}, 'multipart/form-data')
        .then(() => {
          toast.success('Category updated successfully!');
          onSaved();
          onClose();
        })
        .catch((err) => {
          setGeneralError(err);
          toast.error(err);
        })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/categories/create', fd, {}, 'multipart/form-data')
        .then(() => {
          toast.success('Category created successfully!');
          onSaved();
          onClose();
        })
        .catch((err) => {
          setGeneralError(err);
          toast.error(err);
        })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? 'Edit Category' : 'Add Category'}
        <IconButton onClick={onClose} size="small" aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          <TextField
            fullWidth label="Name *" value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={!!fieldErrors.name} helperText={fieldErrors.name}
          />

          <TextField
            fullWidth label="Description" multiline rows={3} value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            error={!!fieldErrors.description} helperText={fieldErrors.description}
          />

          {/* Image upload */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Image (optional · JPEG/PNG/GIF/WebP · max 5 MB)
            </Typography>

            {imagePreview ? (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, display: 'block', border: '2px solid #E7E5E4' }}
                />
                <IconButton
                  size="small" onClick={removeImage} aria-label="Remove image"
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#7F1D1D' }, width: 24, height: 24 }}
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined" startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderStyle: 'dashed', borderColor: '#1B4332', color: '#1B4332', py: 1.5, px: 3 }}
              >
                Choose Image
              </Button>
            )}

            <input
              ref={fileInputRef} type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }} onChange={handleFileChange}
            />

            {fieldErrors.image && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {fieldErrors.image}
              </Typography>
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
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button
            type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}
          >
            {isLoading
              ? <CircularProgress size={20} color="inherit" />
              : isEdit ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemName, onClose, onDeleted }) {
  // state
  const [isLoading, setIsLoading] = useState(false);

  // stable ref so MUI close animation doesn't lose data
  const nameRef = useRef(itemName);
  if (itemName) nameRef.current = itemName;

  // api call
  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    apiDelete(`/categories/delete/${itemId}`)
      .then(() => {
        toast.success(`"${nameRef.current}" deleted.`);
        onDeleted();
        onClose();
      })
      .catch((err) => {
        toast.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete Category</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography>
          Are you sure you want to delete <strong>{nameRef.current}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button
          variant="contained" onClick={handleDelete} disabled={isLoading}
          sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 100 }}
        >
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  // state
  const [isLoading, setIsLoading]           = useState(false);
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
  const [tableData, setTableData]           = useState([]);
  const debounceRef                         = useRef(null);

  // api calls
  const getData = (searchVal = search, offsetVal = offset, pageVal = pageValue) => {
    setIsTableLoading(true);
    apiPost('/categories/list', { page: pageVal + 1, limit, search: searchVal.trim() })
      .then((res) => {
        const { count: total, data } = res.data;
        setTableData(data);
        setCount(total);
      })
      .catch((err) => {
        toast.error(err);
      })
      .finally(() => setIsTableLoading(false));
  };

  const getById = (id) => {
    setIsLoading(true);
    apiGet(`/categories/${id}`)
      .then((res) => {
        setItemData(res.data ?? res);
      })
      .catch(() => {
        // fallback — itemData stays as the row data set before calling
      })
      .finally(() => setIsLoading(false));
  };

  // effects
  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => {
        setOffset(0);
        setPageValue(0);
        getData(search, 0, 0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset);
    setPageValue(newPage);
    getData(search, newOffset, newPage);
  };

  const handleOpenEdit = (row) => {
    setItemId(row.id);
    setItemData(row);       // prefill immediately with row data
    setOpenEdit(true);
    getById(row.id);        // then fetch fresh data in background
  };

  const handleOpenView = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenView(true);
    getById(row.id);
  };

  const handleOpenDelete = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenDelete(true);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setItemId(null);
    setItemData(null);
  };

  const handleCloseView = () => {
    setOpenView(false);
    setItemId(null);
    setItemData(null);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setItemId(null);
    setItemData(null);
  };

  return (
    <AdminShell>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Categories
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="Search by name or slug…" value={search}
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
          <Button
            variant="contained" startIcon={<Add />}
            onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}
          >
            Add Category
          </Button>
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell sx={{ width: 64 }}>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows count={limit} />
              ) : tableData.length === 0 ? (
                <EmptyState search={search} />
              ) : (
                tableData.map((row, idx) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>
                      {offset + idx + 1}
                    </TableCell>
                    <TableCell><CategoryImage src={row.image} size={40} /></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                    <TableCell>
                      <Chip label={row.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 12 }} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {truncate(row.description)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {formatDate(row.createdAt)}
                    </TableCell>
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
        onSaved={() => getData(search, offset, pageValue)}
      />

      <FormModal
        open={openEdit}
        itemId={itemId}
        itemData={itemData}
        onClose={handleCloseEdit}
        onSaved={() => getData(search, offset, pageValue)}
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
            getData(search, offset, pageValue);
          }
        }}
      />
    </AdminShell>
  );
}
