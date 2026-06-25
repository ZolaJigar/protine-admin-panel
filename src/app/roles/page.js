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
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Visibility, ToggleOn, LockOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiPost, apiDelete, apiPatch } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const limit = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ count = 10 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 8 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <TableRow>
      <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          {search ? `No roles found for "${search}"` : 'No roles yet'}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {search ? 'Try a different search term.' : 'Click "Add Role" to create your first one.'}
        </Typography>
      </TableCell>
    </TableRow>
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
    apiDelete(`/roles/delete/${itemId}`)
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
      <DialogTitle sx={{ fontWeight: 700 }}>Delete Role</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography>
          Are you sure you want to delete <strong>{nameRef.current}</strong>?
        </Typography>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Delete will fail if any users are currently assigned to this role.
        </Alert>
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
export default function RolesPage() {
  const router = useRouter();

  // state
  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemId, setItemId]                 = useState(null);
  const [itemData, setItemData]             = useState(null);
  const [openDelete, setOpenDelete]         = useState(false);
  const [count, setCount]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [search, setSearch]                 = useState('');
  const [tableData, setTableData]           = useState([]);
  const [togglingId, setTogglingId]         = useState(null);

  // api calls
  const getData = (searchVal = search, pageVal = pageValue) => {
    setIsTableLoading(true);
    apiPost('/roles/list', { page: pageVal + 1, limit, search: searchVal.trim() })
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
      .then(() => {
        toast.success('Role status updated.');
        getData(search, pageValue);
      })
      .catch((err) => toast.error(err))
      .finally(() => setTogglingId(null));
  };

  // effects
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

  const handleOpenDelete = (row) => {
    setItemId(row.id);
    setItemData(row);
    setOpenDelete(true);
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
          Roles
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
            sx={{ width: 270 }}
          />
          <Button variant="contained" startIcon={<Add />}
            onClick={() => router.push('/roles/add')}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', whiteSpace: 'nowrap' }}>
            Add Role
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
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="center">Permissions</TableCell>
                <TableCell align="center">Editable</TableCell>
                <TableCell align="center">Deletable</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center" sx={{ width: 150 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows count={limit} />
              ) : tableData.length === 0 ? (
                <EmptyState search={search} />
              ) : (
                tableData.map((row, idx) => {
                  const permCount    = row.rolePermissions?.length ?? 0;
                  const notEditable  = row.is_editable  === 0;
                  const notDeletable = row.is_deletable === 0;

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>
                        {offset + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                          {notEditable && (
                            <Tooltip title="Protected role">
                              <LockOutlined sx={{ fontSize: 14, color: '#B91C1C' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.slug} size="small" variant="outlined"
                          sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={permCount} size="small"
                          sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={notEditable ? 'No' : 'Yes'} size="small"
                          sx={notEditable
                            ? { bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }
                            : { bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={notDeletable ? 'No' : 'Yes'} size="small"
                          sx={notDeletable
                            ? { bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }
                            : { bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>

                          {/* View → separate page */}
                          <Tooltip title="View">
                            <IconButton size="small"
                              onClick={() => router.push(`/roles/view/${row.id}`)}
                              sx={{ color: '#0369A1' }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Edit → separate page */}
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

                          {/* Toggle status */}
                          <Tooltip title="Toggle Status">
                            <span>
                              <IconButton size="small"
                                onClick={() => handleToggleActive(row)}
                                disabled={togglingId === row.id}
                                sx={{ color: '#D97706' }}>
                                {togglingId === row.id
                                  ? <CircularProgress size={16} />
                                  : <ToggleOn fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Delete */}
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

      {/* ── Delete modal only ── */}
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
