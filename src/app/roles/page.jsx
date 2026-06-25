/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { TextInput, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Visibility, ToggleOn, LockOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiPost, apiDelete, apiPatch } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, itemId, itemName, onClose, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef(itemName);
  if (itemName) nameRef.current = itemName;

  const handleDelete = () => {
    if (!itemId) return;
    setIsLoading(true);
    apiDelete(`/roles/delete/${itemId}`)
      .then(() => { toast.success(`"${nameRef.current}" deleted.`); onDeleted(); onClose(); })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Role" maxWidth="xs"
      danger confirmLabel="Delete" confirmLoading={isLoading} onConfirm={handleDelete}>
      <Typography>
        Are you sure you want to delete <strong>{nameRef.current}</strong>?
      </Typography>
      <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>
        Delete will fail if any users are currently assigned to this role.
      </Alert>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can('roles_create');
  const canEdit   = can('roles_edit');
  const canDelete = can('roles_delete');
  const canView   = can('roles_detail');

  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemId, setItemId]                 = useState(null);
  const [itemData, setItemData]             = useState(null);
  const [openDelete, setOpenDelete]         = useState(false);
  const [count, setCount]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [search, setSearch]                 = useState('');
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [tableData, setTableData]           = useState([]);
  const [togglingId, setTogglingId]         = useState(null);

  const getData = (searchVal = search, pageVal = pageValue, limitVal = limit) => {
    setIsTableLoading(true);
    apiPost('/roles/list', { page: pageVal + 1, limit: limitVal, search: searchVal.trim() })
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const handleToggleActive = (row) => {
    setTogglingId(row.id);
    apiPatch(`/roles/role-active/${row.id}`)
      .then(() => { toast.success('Role status updated.'); getData(search, pageValue); })
      .catch((err) => toast.error(err))
      .finally(() => setTogglingId(null));
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

  const handleOpenDelete  = (row) => { setItemId(row.id); setItemData(row); setOpenDelete(true); };
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
      key: 'name', label: 'Name',
      render: (row) => {
        const notEditable = row.is_editable === 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
            {notEditable && (
              <Tooltip title="Protected role">
                <LockOutlined sx={{ fontSize: 14, color: '#B91C1C' }} />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      key: 'slug', label: 'Slug',
      render: (row) => (
        <Chip label={row.slug} size="small" variant="outlined"
          sx={{ fontFamily: 'monospace', fontSize: 11 }} />
      ),
    },
    {
      key: 'permissions', label: 'Permissions', align: 'center',
      render: (row) => (
        <Chip label={row.rolePermissions?.length ?? 0} size="small"
          sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }} />
      ),
    },
    {
      key: 'is_editable', label: 'Editable', align: 'center',
      render: (row) => {
        const notEditable = row.is_editable === 0;
        return (
          <Chip label={notEditable ? 'No' : 'Yes'} size="small"
            sx={notEditable
              ? { bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }
              : { bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />
        );
      },
    },
    {
      key: 'is_deletable', label: 'Deletable', align: 'center',
      render: (row) => {
        const notDeletable = row.is_deletable === 0;
        return (
          <Chip label={notDeletable ? 'No' : 'Yes'} size="small"
            sx={notDeletable
              ? { bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }
              : { bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />
        );
      },
    },
    {
      key: 'createdAt', label: 'Created',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>{formatDate(row.createdAt)}</Typography>
      ),
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 150,
      render: (row) => {
        const notEditable  = row.is_editable  === 0;
        const notDeletable = row.is_deletable === 0;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            {canView && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => router.push(`/roles/view/${row.id}`)} sx={{ color: '#0369A1' }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            )}
            {canEdit && (
            <Tooltip title={notEditable ? 'Role is not editable' : 'Edit'}>
              <span>
                <IconButton size="small"
                  onClick={() => !notEditable && router.push(`/roles/edit/${row.id}`)}
                  disabled={notEditable}
                  sx={{ color: notEditable ? 'text.disabled' : '#1B4332' }}>
                  <Edit fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            )}
            {canEdit && (
            <Tooltip title="Toggle Status">
              <span>
                <IconButton size="small"
                  onClick={() => handleToggleActive(row)}
                  disabled={togglingId === row.id}
                  sx={{ color: '#D97706' }}>
                  {togglingId === row.id ? <CircularProgress size={16} /> : <ToggleOn fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            )}
            {canDelete && (
            <Tooltip title={notDeletable ? 'Role cannot be deleted' : 'Delete'}>
              <span>
                <IconButton size="small"
                  onClick={() => !notDeletable && handleOpenDelete(row)}
                  disabled={notDeletable}
                  sx={{ color: notDeletable ? 'text.disabled' : '#B91C1C' }}>
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <AdminShell requiredPermission="roles_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Roles
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
            sx={{ width: 270 }}
          />
          {canCreate && (
          <Button variant="contained" startIcon={<Add />}
            onClick={() => router.push('/roles/add')}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Role
          </Button>
          )}
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No roles found for "${search}"` : 'No roles yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={850}
      />

      {/* ── Delete modal ── */}
      <DeleteModal
        open={openDelete}
        itemId={itemId}
        itemName={itemData?.name}
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
