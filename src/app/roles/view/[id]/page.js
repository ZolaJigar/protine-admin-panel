/* eslint-disable react/display-name */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import PermissionsCheckboxGroup from '@/components/roles/PermissionsCheckboxGroup';
import {
  Box, Paper, Typography, Button, Chip, Alert,
  CircularProgress, Divider, Stack, Skeleton,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function extractPermIds(rolePermissions = []) {
  return rolePermissions.map((rp) => Number(rp.permission_id));
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ViewRolePage() {
  const router = useRouter();
  const { id } = useParams();

  // state
  const [isFetching, setIsFetching]         = useState(true);
  const [role, setRole]                     = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [permsLoading, setPermsLoading]     = useState(false);
  const [fetchError, setFetchError]         = useState('');

  // fetch role + all permissions on mount
  useEffect(() => {
    setIsFetching(true);
    apiGet(`/roles/${id}`)
      .then((res) => setRole(res?.data ?? res))
      .catch((err) => setFetchError(typeof err === 'string' ? err : 'Failed to load role.'))
      .finally(() => setIsFetching(false));

    setPermsLoading(true);
    apiPost('/permissions/list', { page: 1, limit: 200 })
      .then((res) => setAllPermissions(res?.data?.data ?? res?.data ?? []))
      .catch(() => setAllPermissions([]))
      .finally(() => setPermsLoading(false));
  }, [id]);

  // loading skeleton
  if (isFetching) {
    return (
      <AdminShell>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="text" width={160} height={32} />
          <Skeleton variant="rounded" width={90} height={36} />
        </Box>
        <Stack spacing={3}>
          <Paper sx={{ borderRadius: 3, p: 3 }}>
            {[1,2,3,4,5,6].map((i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Skeleton variant="text" width={100} height={24} />
                <Skeleton variant="text" width={200} height={24} />
              </Box>
            ))}
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
      <AdminShell>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>View Role</Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/roles')}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}>Back</Button>
        </Box>
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: 500 }}>{fetchError}</Alert>
      </AdminShell>
    );
  }

  const permIds     = extractPermIds(role?.rolePermissions ?? []);
  const notEditable = role?.is_editable === 0;

  return (
    <AdminShell>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          View Role
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!notEditable && (
            <Button variant="contained" startIcon={<Edit />}
              onClick={() => router.push(`/roles/edit/${id}`)}
              sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
              Edit Role
            </Button>
          )}
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/roles')}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
            Back
          </Button>
        </Box>
      </Box>

      <Stack spacing={3} sx={{ maxWidth: 860 }}>

        {/* ── Basic info card ── */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1B4332' }}>
            Basic Info
          </Typography>
          <Divider sx={{ mb: 2.5 }} />

          <Stack spacing={2}>
            {[
              {
                label: 'Name',
                value: <Typography sx={{ fontWeight: 700 }}>{role?.name}</Typography>,
              },
              {
                label: 'Slug',
                value: <Chip label={role?.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />,
              },
              {
                label: 'Permissions',
                value: <Chip label={permIds.length} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }} />,
              },
              {
                label: 'Editable',
                value: notEditable
                  ? <Chip label="No"  size="small" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }} />
                  : <Chip label="Yes" size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />,
              },
              {
                label: 'Deletable',
                value: role?.is_deletable === 0
                  ? <Chip label="No"  size="small" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }} />
                  : <Chip label="Yes" size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />,
              },
              {
                label: 'Created',
                value: <Typography variant="body2" color="text.secondary">{formatDate(role?.createdAt)}</Typography>,
              },
              {
                label: 'Updated',
                value: <Typography variant="body2" color="text.secondary">{formatDate(role?.updatedAt)}</Typography>,
              },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography component="div"
                  sx={{ width: 110, fontWeight: 700, color: 'text.secondary', flexShrink: 0, fontSize: 14 }}>
                  {label}
                </Typography>
                <Box component="div" sx={{ flex: 1 }}>{value}</Box>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* ── Permissions card (read-only) ── */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1B4332' }}>
              Assigned Permissions
            </Typography>
            <Chip label={`${permIds.length} assigned`} size="small"
              sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }} />
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {permsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : permIds.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
              No permissions assigned to this role.
            </Typography>
          ) : (
            <PermissionsCheckboxGroup
              allPermissions={allPermissions}
              selectedIds={permIds}
              onChange={() => {}}   // read-only — no-op
              disabled={true}
            />
          )}
        </Paper>

      </Stack>
    </AdminShell>
  );
}
