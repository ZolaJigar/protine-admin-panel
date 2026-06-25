/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Chip, Skeleton, Stack, Alert, CircularProgress, Divider,
  Avatar, Select, MenuItem, FormControl, InputLabel, FormHelperText,
  InputAdornment as MuiInputAdornment,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Lock,
  CloudUpload, Visibility, VisibilityOff, ImageNotSupported, History,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiPost, apiPut, apiDelete } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const limit          = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE  = 5 * 1024 * 1024;
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const ROLE_COLORS = {
  super_admin: { bgcolor: '#FEE2E2', color: '#B91C1C' },
  admin:       { bgcolor: '#E0F2FE', color: '#0369A1' },
  default:     { bgcolor: '#D8F3DC', color: '#1B4332' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, GIF, or WebP allowed.';
  if (file.size > MAX_FILE_SIZE) return 'Image must be under 5 MB.';
  return null;
}

function getRoleColors(slug) {
  return ROLE_COLORS[slug] ?? ROLE_COLORS.default;
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ count = 10 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 9 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <TableRow>
      <TableCell colSpan={9} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          {search ? `No users found for "${search}"` : 'No users yet'}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {search ? 'Try a different search term.' : 'Click "Add User" to create your first one.'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── User Avatar ──────────────────────────────────────────────────────────────
function UserAvatar({ src, name, size = 36 }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #E7E5E4', flexShrink: 0 }}
      />
    );
  }
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: '#1B4332', color: '#F59E0B', fontSize: size * 0.38, fontWeight: 800 }}>
      {getInitials(name)}
    </Avatar>
  );
}

// ─── Form Modal (Create / Edit) ───────────────────────────────────────────────
function FormModal({ open, itemId, itemData, onClose, onSaved }) {
  const isEdit = !!itemId;

  // state
  const [isLoading, setIsLoading]         = useState(false);
  const [roles, setRoles]                 = useState([]);
  const [rolesLoading, setRolesLoading]   = useState(false);
  const [form, setForm]                   = useState({ name: '', email: '', password: '', role_id: '', gender: '', phone: '' });
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [fieldErrors, setFieldErrors]     = useState({});
  const [generalError, setGeneralError]   = useState('');
  const fileInputRef                      = useRef();

  // fetch roles when modal opens
  useEffect(() => {
    if (open) {
      setRolesLoading(true);
      apiPost('/roles/list', { page: 1, limit: 100 })
        .then((res) => {
          const list = res?.data?.data ?? res?.data ?? [];
          setRoles(list);
        })
        .catch(() => setRoles([]))
        .finally(() => setRolesLoading(false));
    }
  }, [open]);

  // pre-fill form
  useEffect(() => {
    if (open) {
      if (isEdit && itemData) {
        setForm({
          name:     itemData.name    || '',
          email:    itemData.email   || '',
          password: '',
          role_id:  itemData.role_id || '',
          gender:   itemData.gender  || '',
          phone:    itemData.phone   || '',
        });
        setImagePreview(itemData.image || '');
      } else {
        setForm({ name: '', email: '', password: '', role_id: '', gender: '', phone: '' });
        setImagePreview('');
      }
      setImageFile(null);
      setChangePassword(false);
      setShowPassword(false);
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
    if (!form.name.trim())                           errors.name     = 'Name is required';
    else if (form.name.length > 255)                 errors.name     = 'Max 255 characters';
    if (!form.email.trim())                          errors.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
    else if (form.email.length > 255)                errors.email    = 'Max 255 characters';
    if (!isEdit) {
      if (!form.password)                            errors.password = 'Password is required';
      else if (form.password.length < 6)             errors.password = 'Min 6 characters';
      else if (form.password.length > 255)           errors.password = 'Max 255 characters';
    } else if (changePassword) {
      if (!form.password)                            errors.password = 'Enter new password';
      else if (form.password.length < 6)             errors.password = 'Min 6 characters';
    }
    if (!form.role_id)                               errors.role_id  = 'Role is required';
    if (form.gender && !GENDER_OPTIONS.includes(form.gender)) errors.gender = 'Invalid gender';
    if (form.phone && form.phone.length > 20)        errors.phone    = 'Max 20 characters';
    return errors;
  };

  // api calls
  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const fd = new FormData();
    if (isEdit) {
      // only append changed fields
      if (form.name)                fd.append('name',     form.name.trim());
      if (form.email)               fd.append('email',    form.email.trim());
      if (changePassword && form.password) fd.append('password', form.password);
      if (form.role_id)             fd.append('role_id',  form.role_id);
      if (form.gender)              fd.append('gender',   form.gender);
      if (form.phone)               fd.append('phone',    form.phone.trim());
      if (imageFile)                fd.append('image',    imageFile);
    } else {
      fd.append('name',     form.name.trim());
      fd.append('email',    form.email.trim());
      fd.append('password', form.password);
      fd.append('role_id',  form.role_id);
      if (form.gender) fd.append('gender', form.gender);
      if (form.phone)  fd.append('phone',  form.phone.trim());
      if (imageFile)   fd.append('image',  imageFile);
    }

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/users/update/${itemId}`, fd, {}, 'multipart/form-data')
        .then(() => {
          toast.success('User updated successfully!');
          onSaved();
          onClose();
        })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/users/create', fd, {}, 'multipart/form-data')
        .then(() => {
          toast.success('User created successfully!');
          onSaved();
          onClose();
        })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? 'Edit User' : 'Add User'}
        <IconButton onClick={onClose} size="small" aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          {/* Avatar / Image */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E7E5E4' }} />
                  <IconButton size="small" onClick={removeImage} aria-label="Remove image"
                    sx={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, bgcolor: '#B91C1C', color: '#fff', '&:hover': { bgcolor: '#7F1D1D' } }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                </>
              ) : (
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 28, fontWeight: 800 }}>
                  {getInitials(form.name) || '?'}
                </Avatar>
              )}
            </Box>
            <Box>
              <Button variant="outlined" size="small" startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderColor: '#1B4332', color: '#1B4332', mb: 0.5 }}>
                {imagePreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                JPEG/PNG/GIF/WebP · max 5 MB (optional)
              </Typography>
            </Box>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }} onChange={handleFileChange} />
          </Box>

          {/* Name + Email */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Name *" value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={!!fieldErrors.name} helperText={fieldErrors.name} />
            <TextField fullWidth label="Email *" type="email" value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={!!fieldErrors.email} helperText={fieldErrors.email} />
          </Box>

          {/* Password */}
          {isEdit ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: changePassword ? 1.5 : 0 }}>
                <input type="checkbox" id="chg-pwd" checked={changePassword}
                  onChange={(e) => { setChangePassword(e.target.checked); setField('password', ''); }} />
                <label htmlFor="chg-pwd" style={{ fontSize: 14, cursor: 'pointer', color: '#44403C' }}>
                  Change password
                </label>
              </Box>
              {changePassword && (
                <TextField fullWidth label="New Password *" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={(e) => setField('password', e.target.value)}
                  error={!!fieldErrors.password} helperText={fieldErrors.password}
                  slotProps={{ input: { endAdornment: (
                    <MuiInputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((p) => !p)} aria-label="Toggle password">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </MuiInputAdornment>
                  ) } }} />
              )}
            </Box>
          ) : (
            <TextField fullWidth label="Password *" type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={(e) => setField('password', e.target.value)}
              error={!!fieldErrors.password} helperText={fieldErrors.password}
              slotProps={{ input: { endAdornment: (
                <MuiInputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword((p) => !p)} aria-label="Toggle password">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </MuiInputAdornment>
              ) } }} />
          )}

          {/* Role + Gender */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth error={!!fieldErrors.role_id} disabled={rolesLoading}>
              <InputLabel>Role *</InputLabel>
              <Select value={form.role_id} label="Role *" onChange={(e) => setField('role_id', e.target.value)}>
                {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </Select>
              {fieldErrors.role_id && <FormHelperText>{fieldErrors.role_id}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={(e) => setField('gender', e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {GENDER_OPTIONS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Phone */}
          <TextField fullWidth label="Phone" value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            error={!!fieldErrors.phone} helperText={fieldErrors.phone} />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
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
    apiDelete(`/users/delete/${itemId}`)
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
      <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography>
          Are you sure you want to delete <strong>{nameRef.current}</strong>? This action cannot be undone.
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const router = useRouter();

  // state
  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemId, setItemId]                 = useState(null);
  const [itemData, setItemData]             = useState(null);
  const [openAdd, setOpenAdd]               = useState(false);
  const [openEdit, setOpenEdit]             = useState(false);
  const [openDelete, setOpenDelete]         = useState(false);
  const [count, setCount]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [search, setSearch]                 = useState('');
  const [tableData, setTableData]           = useState([]);

  // api calls
  const getData = (searchVal = search, pageVal = pageValue) => {
    setIsTableLoading(true);
    apiPost('/users/list', { page: pageVal + 1, limit, search: searchVal.trim() })
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
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
        getData(search, 0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleTableChange = (newPage) => {
    const newOffset = newPage * limit;
    setOffset(newOffset);
    setPageValue(newPage);
    getData(search, newPage);
  };

  const handleOpenEdit = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenEdit(true);
  };

  const handleOpenDelete = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenDelete(true);
  };

  const handleCloseAdd = () => setOpenAdd(false);

  const handleCloseEdit = () => {
    setOpenEdit(false);
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
          Users
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="Search by name or email…" value={search}
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
            sx={{ width: 280 }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add User
          </Button>
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell sx={{ width: 56 }}>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center" sx={{ width: 110 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows count={limit} />
              ) : tableData.length === 0 ? (
                <EmptyState search={search} />
              ) : (
                tableData.map((row, idx) => {
                  const isSuperAdmin = row.role?.slug === 'super_admin';
                  const roleColor    = getRoleColors(row.role?.slug);
                  return (
                    <TableRow key={row.id} hover sx={{ opacity: isSuperAdmin ? 0.85 : 1 }}>
                      <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>
                        {offset + idx + 1}
                      </TableCell>
                      <TableCell>
                        <UserAvatar src={row.image} name={row.name} size={36} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                          {isSuperAdmin && <Lock sx={{ fontSize: 13, color: '#B91C1C' }} />}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{row.email}</TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{row.phone || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{row.gender || '—'}</TableCell>
                      <TableCell>
                        <Chip label={row.role?.name || '—'} size="small"
                          sx={{ ...roleColor, fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {isSuperAdmin ? (
                            <Tooltip title="Super admin — protected">
                              <span>
                                <IconButton size="small" disabled sx={{ color: 'text.disabled' }}>
                                  <Lock fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#1B4332' }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Login Logs">
                                <IconButton size="small"
                                  onClick={() => router.push(`/logs?user_id=${row.id}`)}
                                  sx={{ color: '#7C3AED' }}>
                                  <History fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleOpenDelete(row)} sx={{ color: '#B91C1C' }}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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
      <FormModal open={openAdd} itemId={null} itemData={null}
        onClose={handleCloseAdd} onSaved={() => getData(search, pageValue)} />

      <FormModal open={openEdit} itemId={itemId} itemData={itemData}
        onClose={handleCloseEdit} onSaved={() => getData(search, pageValue)} />

      <DeleteModal open={openDelete} itemId={itemId} itemName={itemData?.name}
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
