/* eslint-disable react/display-name */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import PermissionsCheckboxGroup from '@/components/roles/PermissionsCheckboxGroup';
import { TextInput } from '@/components/ui';
import {
  Box, Paper, Typography, Button,
  Chip, Alert, CircularProgress, Divider,
  Switch, FormControlLabel, Stack, Skeleton,
} from '@mui/material';
import { ArrowBack, LockOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { nameToSlug } from '@/utils/functions';

function extractPermIds(rolePermissions = []) {
  return rolePermissions.map((rp) => Number(rp.permission_id));
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditRolePage() {
  const router = useRouter();
  const { id } = useParams();

  const [isLoading, setIsLoading]             = useState(false);
  const [isFetching, setIsFetching]           = useState(true);
  const [allPermissions, setAllPermissions]   = useState([]);
  const [permsLoading, setPermsLoading]       = useState(false);
  const [form, setForm]                       = useState({ name: '', is_editable: 1, is_deletable: 1 });
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [fieldErrors, setFieldErrors]         = useState({});
  const [generalError, setGeneralError]       = useState('');
  const [notEditable, setNotEditable]         = useState(false);
  const [fetchError, setFetchError]           = useState('');

  useEffect(() => {
    setIsFetching(true);
    apiGet(`/roles/${id}`)
      .then((res) => {
        const role = res?.data ?? res;
        setForm({
          name:         role.name         ?? '',
          is_editable:  role.is_editable  ?? 1,
          is_deletable: role.is_deletable ?? 1,
        });
        setSelectedPermIds(extractPermIds(role.rolePermissions ?? []));
        setNotEditable(role.is_editable === 0);
      })
      .catch((err) => setFetchError(typeof err === 'string' ? err : 'Failed to load role.'))
      .finally(() => setIsFetching(false));

    setPermsLoading(true);
    apiPost('/permissions/list', { page: 1, limit: 200 })
      .then((res) => setAllPermissions(res?.data?.data ?? res?.data ?? []))
      .catch(() => setAllPermissions([]))
      .finally(() => setPermsLoading(false));
  }, [id]);

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: '' }));
  };

  const validateField = (key, val) => {
    switch (key) {
      case 'name': return !val.trim()      ? 'Name is required'
                        : val.length > 255 ? 'Max 255 characters' : '';
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

    setIsLoading(true);
    apiPut(`/roles/update/${id}`, {
      name:         form.name.trim(),
      is_editable:  form.is_editable,
      is_deletable: form.is_deletable,
      permissions:  selectedPermIds,
    })
      .then(() => { toast.success('Role updated successfully!'); router.push('/roles'); })
      .catch((err) => { setGeneralError(err); toast.error(err); })
      .finally(() => setIsLoading(false));
  };

  if (isFetching) {
    return (
      <AdminShell requiredPermission="roles_edit">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="text" width={160} height={32} />
          <Skeleton variant="rounded" width={90} height={36} />
        </Box>
        <Stack spacing={3}>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={200} height={24} />
          </Paper>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
            {[1,2,3].map((i) => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1.5 }} />)}
          </Paper>
        </Stack>
      </AdminShell>
    );
  }

  if (fetchError) {
    return (
      <AdminShell requiredPermission="roles_edit">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>Edit Role</Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/roles')}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}>Back</Button>
        </Box>
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: 500 }}>{fetchError}</Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell requiredPermission="roles_edit">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>Edit Role</Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/roles')}
          sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
          Back
        </Button>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {notEditable && (
            <Alert severity="warning" icon={<LockOutlined fontSize="small" />} sx={{ borderRadius: 2 }}>
              This role is protected and cannot be edited.
            </Alert>
          )}
          {generalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{generalError}</Alert>}

          {/* ── Basic info card ── */}
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1B4332' }}>Basic Info</Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2.5}>
              <TextInput
                label="Role Name *"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                error={fieldErrors.name}
                disabled={notEditable}
                required
              />

              {form.name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Slug preview:</Typography>
                  <Chip label={nameToSlug(form.name)} size="small" variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                  <Typography variant="caption" color="text.disabled">(auto-generated by server)</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 4 }}>
                <FormControlLabel label="Editable" control={
                  <Switch checked={!!form.is_editable}
                    onChange={(e) => setField('is_editable', e.target.checked ? 1 : 0)}
                    disabled={notEditable}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1B4332' } }} />
                } />
                <FormControlLabel label="Deletable" control={
                  <Switch checked={!!form.is_deletable}
                    onChange={(e) => setField('is_deletable', e.target.checked ? 1 : 0)}
                    disabled={notEditable}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1B4332' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1B4332' } }} />
                } />
              </Box>
            </Stack>
          </Paper>

          {/* ── Permissions card ── */}
          <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1B4332' }}>Permissions</Typography>
              <Chip label={`${selectedPermIds.length} selected`} size="small"
                sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }} />
            </Box>
            <Divider sx={{ mb: 2.5 }} />

            {permsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <PermissionsCheckboxGroup
                allPermissions={allPermissions}
                selectedIds={selectedPermIds}
                onChange={setSelectedPermIds}
                disabled={notEditable}
              />
            )}
          </Paper>

          {/* ── Actions ── */}
          {!notEditable && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => router.push('/roles')} disabled={isLoading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isLoading}
                sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 140 }}>
                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Stack>
      </Box>
    </AdminShell>
  );
}
