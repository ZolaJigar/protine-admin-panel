/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { TextInput, Modal } from '@/components/ui';
import {
  Box, Paper, Typography, Button, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton,
  Tooltip, Chip, Skeleton, Stack, Alert, CircularProgress,
  Avatar, ToggleButtonGroup, ToggleButton, IconButton as MuiIconButton,
} from '@mui/material';
import {
  Search, CheckCircle, Cancel, InfoOutlined,
  ContentCopy, ArrowBack,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiPost } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const limit = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function truncate(str, n = 55) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text)
    .then(() => toast.success('Copied!'))
    .catch(() => toast.error('Copy failed'));
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: limit }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onClear }) {
  return (
    <TableRow>
      <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          No login logs found
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
          No logs match your current filters.
        </Typography>
        <Button variant="outlined" size="small" onClick={onClear}
          sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
          Clear Filters
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ open, itemData, onClose }) {
  const ref = useRef(itemData);
  if (itemData) ref.current = itemData;
  const item = ref.current;
  if (!item) return null;

  const isSuccess = item.login_status === 'success';

  return (
    <Modal open={open} onClose={onClose} title="Login Log Details" maxWidth="sm"
      actions={<Button variant="outlined" onClick={onClose}>Close</Button>}
    >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Status */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography component="div" sx={{ width: 130, fontWeight: 700, color: 'text.secondary', fontSize: 14, flexShrink: 0 }}>Status</Typography>
            <Box component="div">
              {isSuccess
                ? <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Success" size="small" sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
                : <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label="Failed"  size="small" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />}
            </Box>
          </Box>

          {/* User */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Typography component="div" sx={{ width: 130, fontWeight: 700, color: 'text.secondary', fontSize: 14, flexShrink: 0 }}>User</Typography>
            <Box component="div">
              {item.user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 11, fontWeight: 800 }}>
                    {getInitials(item.user.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.user.email}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unknown / Guest</Typography>
              )}
            </Box>
          </Box>

          {/* IP Address */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography component="div" sx={{ width: 130, fontWeight: 700, color: 'text.secondary', fontSize: 14, flexShrink: 0 }}>IP Address</Typography>
            <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{item.ip_address || '—'}</Typography>
              {item.ip_address && (
                <Tooltip title="Copy IP">
                  <MuiIconButton size="small" onClick={() => copyToClipboard(item.ip_address)} sx={{ color: 'text.secondary' }}>
                    <ContentCopy sx={{ fontSize: 14 }} />
                  </MuiIconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Browser */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Typography component="div" sx={{ width: 130, fontWeight: 700, color: 'text.secondary', fontSize: 14, flexShrink: 0 }}>Browser</Typography>
            <Typography component="div" variant="body2"
              sx={{ flex: 1, wordBreak: 'break-all', fontSize: 12, bgcolor: '#F8F8F8', p: 1, borderRadius: 1, fontFamily: 'monospace', lineHeight: 1.6 }}>
              {item.browser || '—'}
            </Typography>
          </Box>

          {/* Reason */}
          {!isSuccess && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography component="div" sx={{ width: 130, fontWeight: 700, color: 'text.secondary', fontSize: 14, flexShrink: 0 }}>Reason</Typography>
              <Typography component="div" variant="body2" sx={{ color: '#B91C1C' }}>
                {item.failed_reason || '—'}
              </Typography>
            </Box>
          )}

          {/* Login Time */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography component="div" sx={{ width: 130, fontWeight: 700, color: 'text.secondary', fontSize: 14, flexShrink: 0 }}>Login Time</Typography>
            <Box component="div">
              <Typography variant="body2">{formatDateTime(item.createdAt)}</Typography>
              <Typography variant="caption" color="text.disabled">{timeAgo(item.createdAt)}</Typography>
            </Box>
          </Box>

        </Box>
      </Modal>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ total, successCount, failedCount }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
      {[
        { label: 'Total',   value: total,        bgcolor: '#F1F5F0', color: '#1B4332' },
        { label: 'Success', value: successCount, bgcolor: '#D8F3DC', color: '#1B4332' },
        { label: 'Failed',  value: failedCount,  bgcolor: '#FEE2E2', color: '#B91C1C' },
      ].map(({ label, value, bgcolor, color }) => (
        <Paper key={label} variant="outlined" sx={{ px: 2.5, py: 1.25, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
          <Chip label={value ?? '—'} size="small" sx={{ bgcolor, color, fontWeight: 700 }} />
        </Paper>
      ))}
    </Box>
  );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────
function LogsPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // state — exact categories pattern
  const [isSearch, setIsSearch]             = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [itemData, setItemData]             = useState(null);
  const [openDetail, setOpenDetail]         = useState(false);
  const [count, setCount]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [search, setSearch]                 = useState('');
  const [tableData, setTableData]           = useState([]);
  const [filterStatus, setFilterStatus]     = useState('');   // '' | 'success' | 'failed'
  const [filterUserId, setFilterUserId]     = useState('');
  const [successCount, setSuccessCount]     = useState(null);
  const [failedCount, setFailedCount]       = useState(null);

  // read URL params on mount
  useEffect(() => {
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('user_id') || '';
    setFilterStatus(status);
    setFilterUserId(userId);
    getData(search, 0, status, userId);
    fetchCounts(userId);
  }, []);

  // api calls
  const getData = (searchVal = search, pageVal = pageValue, statusVal = filterStatus, userVal = filterUserId) => {
    setIsTableLoading(true);
    const body = { page: pageVal + 1, limit, search: searchVal.trim() };
    if (statusVal) body.login_status = statusVal;
    if (userVal)   body.user_id      = Number(userVal);

    apiPost('/logs/login-logs', body)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  const fetchCounts = (userVal = filterUserId) => {
    const base = userVal ? { user_id: Number(userVal) } : {};
    apiPost('/logs/login-logs', { ...base, login_status: 'success', page: 1, limit: 1 })
      .then((res) => setSuccessCount(res?.data?.count ?? 0))
      .catch(() => {});
    apiPost('/logs/login-logs', { ...base, login_status: 'failed', page: 1, limit: 1 })
      .then((res) => setFailedCount(res?.data?.count ?? 0))
      .catch(() => {});
  };

  // effects
  useEffect(() => {
    if (isSearch) {
      const t = setTimeout(() => {
        setOffset(0);
        setPageValue(0);
        getData(search, 0, filterStatus, filterUserId);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const pushUrl = (status, userId) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (userId) params.set('user_id', userId);
    router.push(`/logs${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleStatusFilter = (_, val) => {
    const s = val ?? '';
    setFilterStatus(s);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, s, filterUserId);
    pushUrl(s, filterUserId);
  };

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit);
    setPageValue(newPage);
    getData(search, newPage, filterStatus, filterUserId);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterUserId('');
    setOffset(0);
    setPageValue(0);
    setIsSearch(false);
    getData('', 0, '', '');
    fetchCounts('');
    router.push('/logs');
  };

  const handleOpenDetail = (row) => {
    setItemData(row);
    setOpenDetail(true);
  };

  const isFiltered = !!(search || filterStatus || filterUserId);

  return (
    <AdminShell requiredPermission="login_logs_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {filterUserId && (
            <Button variant="outlined" size="small" startIcon={<ArrowBack />}
              onClick={() => router.push('/users')}
              sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
              Back to Users
            </Button>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
            Login Logs
            {!isTableLoading && (
              <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
            )}
          </Typography>
        </Box>

        {/* Filter bar */}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status toggle */}
          <ToggleButtonGroup
            value={filterStatus || null}
            exclusive
            onChange={handleStatusFilter}
            size="small"
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, py: 0.5, fontSize: 13 } }}
          >
            <ToggleButton value={null}>All</ToggleButton>
            <ToggleButton value="success" sx={{ '&.Mui-selected': { bgcolor: '#D8F3DC', color: '#1B4332' } }}>
              ✅ Success
            </ToggleButton>
            <ToggleButton value="failed" sx={{ '&.Mui-selected': { bgcolor: '#FEE2E2', color: '#B91C1C' } }}>
              ❌ Failed
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Search */}
          <TextInput
            size="small" placeholder="Search IP, browser, reason…" value={search}
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

          {/* Clear filters */}
          {isFiltered && (
            <Button variant="outlined" size="small" onClick={handleClearFilters}
              sx={{ borderColor: '#B91C1C', color: '#B91C1C', whiteSpace: 'nowrap' }}>
              Clear Filters
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Stats bar ── */}
      <StatsBar total={count} successCount={successCount} failedCount={failedCount} />

      {/* ── User filter indicator ── */}
      {filterUserId && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={handleClearFilters}>Show All</Button>}>
          Showing logs for user ID: <strong>{filterUserId}</strong>
        </Alert>
      )}

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Browser</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Login Time</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows />
              ) : tableData.length === 0 ? (
                <EmptyState onClear={handleClearFilters} />
              ) : (
                tableData.map((row, idx) => {
                  const isSuccess = row.login_status === 'success';
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>
                        {offset + idx + 1}
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        {row.user ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                              {getInitials(row.user.name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{row.user.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{row.user.email}</Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: 13 }}>
                            Unknown
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        {isSuccess
                          ? <Chip icon={<CheckCircle sx={{ fontSize: 13 }} />} label="Success" size="small"
                              sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700, fontSize: 11 }} />
                          : <Chip icon={<Cancel sx={{ fontSize: 13 }} />} label="Failed" size="small"
                              sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: 11 }} />}
                      </TableCell>

                      {/* IP */}
                      <TableCell sx={{ fontSize: 13, fontFamily: 'monospace' }}>
                        {row.ip_address || '—'}
                      </TableCell>

                      {/* Browser */}
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary', maxWidth: 200 }}>
                        <Tooltip title={row.browser || ''} placement="top">
                          <span>{truncate(row.browser)}</span>
                        </Tooltip>
                      </TableCell>

                      {/* Reason */}
                      <TableCell sx={{ fontSize: 13, color: '#B91C1C', maxWidth: 160 }}>
                        {isSuccess ? (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        ) : (
                          <Tooltip title={row.failed_reason || ''} placement="top">
                            <span>{truncate(row.failed_reason, 40)}</span>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Login Time */}
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        <Tooltip title={timeAgo(row.createdAt)} placement="top">
                          <span>{formatDateTime(row.createdAt)}</span>
                        </Tooltip>
                      </TableCell>

                      {/* Details */}
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDetail(row)} sx={{ color: '#0369A1' }}>
                            <InfoOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, borderTop: '1px solid #E7E5E4' }}>
          {count > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              Showing {offset + 1}–{Math.min(offset + limit, count)} of {count} logs
            </Typography>
          )}
          <TablePagination
            component="div"
            count={count}
            page={pageValue}
            onPageChange={(_, newPage) => handleTableChange(newPage)}
            rowsPerPage={limit}
            rowsPerPageOptions={[limit]}
            sx={{ border: 'none', '& .MuiTablePagination-toolbar': { pl: 0 } }}
          />
        </Box>
      </Paper>

      {/* ── Detail Modal ── */}
      <DetailModal
        open={openDetail}
        itemData={itemData}
        onClose={() => { setOpenDetail(false); setItemData(null); }}
      />
    </AdminShell>
  );
}

// ─── Page export (wraps in Suspense for useSearchParams) ─────────────────────
export default function LogsPage() {
  return (
    <Suspense fallback={null}>
      <LogsPageInner />
    </Suspense>
  );
}
