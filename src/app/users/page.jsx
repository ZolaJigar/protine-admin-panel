/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table, Modal } from '@/components/ui';
import PhoneInput from '@/components/PhoneInput';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
  Avatar, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Close, Search, Lock,
  CloudUpload, Visibility, VisibilityOff, ImageNotSupported,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import {
  DEFAULT_LIMIT,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  GENDER_OPTIONS,
  ROLE_COLORS,
} from '@/constants/values';
import { dateFormat12, getInitials, validateImageFile } from '@/utils/functions';

// ─── Local aliases ────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ACCEPTED_IMAGE_TYPES;
const MAX_FILE_SIZE  = MAX_IMAGE_SIZE;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = dateFormat12;

function getRoleColors(slug) {
  return ROLE_COLORS[slug] ?? ROLE_COLORS.default;
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

  const [isLoading, setIsLoading]           = useState(false);
  const [roles, setRoles]                   = useState([]);
  const [rolesLoading, setRolesLoading]     = useState(false);
  const [form, setForm]                     = useState({ name: '', email: '', password: '', role_id: '', gender: '', phone: '', country_code: '91', dob: '' });
  const [imageFile, setImageFile]           = useState(null);
  const [imagePreview, setImagePreview]     = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [fieldErrors, setFieldErrors]       = useState({});
  const [generalError, setGeneralError]     = useState('');
  const fileInputRef                        = useRef();

  useEffect(() => {
    if (open) {
      setRolesLoading(true);
      apiPost('/roles/list', { page: 1, limit: 100 })
        .then((res) => setRoles(res?.data?.data ?? res?.data ?? []))
        .catch(() => setRoles([]))
        .finally(() => setRolesLoading(false));
    }
  }, [open]);

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
          country_code: itemData.country_code || '91',
          dob:      itemData.dob ? itemData.dob.slice(0, 10) : '',
        });
        setImagePreview(itemData.image || '');
      } else {
        setForm({ name: '', email: '', password: '', role_id: '', gender: '', phone: '', country_code: '91', dob: '' });
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

  const validateField = (key, val) => {
    switch (key) {
      case 'name':     return !val.trim()                          ? 'Name is required'
                            : val.length > 255                     ? 'Max 255 characters'      : '';
      case 'email':    return !val.trim()                          ? 'Email is required'
                            : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? 'Enter a valid email'
                            : val.length > 255                     ? 'Max 255 characters'      : '';
      case 'password': if (!isEdit) {
                         return !val                               ? 'Password is required'
                              : val.length < 6                     ? 'Min 6 characters'
                              : val.length > 255                   ? 'Max 255 characters'      : '';
                       } else if (changePassword) {
                         return !val                               ? 'Enter new password'
                              : val.length < 6                     ? 'Min 6 characters'        : '';
                       }
                       return '';
      case 'role_id':  return !val                                 ? 'Role is required'        : '';
      case 'phone':    return val && val.length > 20               ? 'Max 20 characters'       : '';
      default:         return '';
    }
  };

  const handleBlur = (key) => {
    const val = form[key] ?? '';
    const msg = validateField(key, val);
    setFieldErrors((prev) => ({ ...prev, [key]: msg }));
  };

  const validate = () => {
    const errors = {};
    ['name', 'email', 'password', 'role_id', 'phone'].forEach((key) => {
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
      if (form.name)                fd.append('name',         form.name.trim());
      if (form.email)               fd.append('email',        form.email.trim());
      if (changePassword && form.password) fd.append('password', form.password);
      if (form.role_id)             fd.append('role_id',      form.role_id);
      if (form.gender)              fd.append('gender',       form.gender);
      if (form.phone)               fd.append('phone',        form.phone.trim());
      if (form.country_code)        fd.append('country_code', form.country_code);
      if (form.dob)                 fd.append('dob',          form.dob);
      if (imageFile)                fd.append('image',        imageFile);
    } else {
      fd.append('name',     form.name.trim());
      fd.append('email',    form.email.trim());
      fd.append('password', form.password);
      fd.append('role_id',  form.role_id);
      if (form.gender)       fd.append('gender',       form.gender);
      if (form.phone)        fd.append('phone',        form.phone.trim());
      if (form.country_code) fd.append('country_code', form.country_code);
      if (form.dob)          fd.append('dob',          form.dob);
      if (imageFile)         fd.append('image',        imageFile);
    }

    setIsLoading(true);
    if (isEdit) {
      apiPut(`/users/update/${itemId}`, fd, {}, 'multipart/form-data')
        .then(() => { toast.success('User updated successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    } else {
      apiPost('/users/create', fd, {}, 'multipart/form-data')
        .then(() => { toast.success('User created successfully!'); onSaved(); onClose(); })
        .catch((err) => { setGeneralError(err); toast.error(err); })
        .finally(() => setIsLoading(false));
    }
  };

  // Password eye-toggle endAdornment
  const passwordEndAdornment = (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setShowPassword((p) => !p)} aria-label="Toggle password">
        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
            <TextInput
              label="Name *"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={fieldErrors.name}
              required
            />
            <TextInput
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={fieldErrors.email}
              required
            />
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
                <TextInput
                  label="New Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={fieldErrors.password}
                  slotProps={{ input: { endAdornment: passwordEndAdornment } }}
                />
              )}
            </Box>
          ) : (
            <TextInput
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              error={fieldErrors.password}
              slotProps={{ input: { endAdornment: passwordEndAdornment } }}
            />
          )}

          {/* Role + Gender */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Select
              label="Role *"
              value={form.role_id}
              onChange={(e) => setField('role_id', e.target.value)}
              onBlur={() => handleBlur('role_id')}
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
              error={fieldErrors.role_id}
              disabled={rolesLoading}
              required
              fullWidth
            />
            <Select
              label="Gender"
              value={form.gender}
              onChange={(e) => setField('gender', e.target.value)}
              options={[
                { label: 'None', value: '' },
                ...GENDER_OPTIONS.map((g) => ({ label: g, value: g })),
              ]}
              error={fieldErrors.gender}
              fullWidth
            />
          </Box>

          {/* DOB + Phone */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextInput
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(e) => setField('dob', e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().slice(0, 10) } }}
              error={fieldErrors.dob}
            />
          </Box>

          {/* Phone */}
          <PhoneInput
            label="Phone"
            value={form.phone}
            dialCode={form.country_code}
            onChange={(phoneNumber, dialCode) => {
              setField('phone', phoneNumber);
              setField('country_code', dialCode);
            }}
            error={fieldErrors.phone}
            disabled={isLoading}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Add User'}
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
    apiDelete(`/users/delete/${itemId}`)
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete User" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete <strong>{nameRef.current}</strong>? This action cannot be undone.
      </Typography>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can('users_create');
  const canEdit   = can('users_edit');
  const canDelete = can('users_delete');

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
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);

  const getData = (searchVal = search, pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    apiPost('/users/list', { page: pageVal + 1, limit: limitVal, search: searchVal.trim() })
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  useEffect(() => { getData(); }, []);

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

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, newLimit);
  };

  const handleOpenEdit   = (row) => { setItemId(row.id); setItemData(row); setOpenEdit(true); };
  const handleOpenDelete = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
  const handleCloseAdd   = () => setOpenAdd(false);
  const handleCloseEdit  = () => { setOpenEdit(false);   setItemId(null); setItemData(null); };
  const handleCloseDelete = () => { setOpenDelete(false); setItemId(null); setItemData(null); };

  // ─── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (row, idx) => (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography>
      ),
    },
    {
      key: 'avatar', label: 'Avatar', width: 56,
      render: (row) => <UserAvatar src={row.image} name={row.name} size={36} />,
    },
    {
      key: 'name', label: 'Name',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
          {row.role?.slug === 'super_admin' && <Lock sx={{ fontSize: 13, color: '#B91C1C' }} />}
        </Box>
      ),
    },
    { key: 'email',  label: 'Email',
      render: (row) => <Typography variant="body2" sx={{ fontSize: 13 }}>{row.email}</Typography> },
    { key: 'phone',  label: 'Phone',
      render: (row) => <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>{row.phone || '—'}</Typography> },
    { key: 'gender', label: 'Gender',
      render: (row) => <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>{row.gender || '—'}</Typography> },
    {
      key: 'role', label: 'Role',
      render: (row) => {
        const roleColor = getRoleColors(row.role?.slug);
        return <Chip label={row.role?.name || '—'} size="small"
          sx={{ ...roleColor, fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />;
      },
    },
    { key: 'createdAt', label: 'Created',
      render: (row) => <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography> },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 110,
      render: (row) => {
        const isSuperAdmin = row.role?.slug === 'super_admin';
        return (
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
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <AdminShell requiredPermission="users_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Users
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextInput
            size="small"
            placeholder="Search by name or email…"
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
            sx={{ width: 280 }}
          />
          {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add User
          </Button>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No users found for "${search}"` : 'No users yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={850}
      />

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
