/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Tooltip,
  Chip, Skeleton, CircularProgress, Divider,
} from '@mui/material';
import { Search, Visibility, Close } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPut } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_STATUSES = ['Delivered', 'Pending', 'Shipped', 'Processing', 'Cancelled'];

const statusColors = {
  Delivered:  { bgcolor: '#D8F3DC', color: '#1B4332' },
  Pending:    { bgcolor: '#FEF3C7', color: '#92400E' },
  Shipped:    { bgcolor: '#E0F2FE', color: '#0369A1' },
  Processing: { bgcolor: '#EDE9FE', color: '#7C3AED' },
  Cancelled:  { bgcolor: '#FEE2E2', color: '#B91C1C' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ count = 10 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((__, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <TableRow>
      <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
          {search ? `No orders found for "${search}"` : 'No orders yet'}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {search ? 'Try a different search term.' : 'Orders will appear here once placed.'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── View Order Modal ─────────────────────────────────────────────────────────
function ViewModal({ open, order, onClose, onStatusUpdated }) {
  // stable ref so MUI close animation doesn't lose data
  const ref = useRef(order);
  if (order) ref.current = order;
  const item = ref.current;

  // state — must be before any conditional return
  const [isUpdating, setIsUpdating]       = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    if (open && item) setCurrentStatus(item.status);
  }, [open, item]);

  // api call
  const handleStatusChange = (newStatus) => {
    if (!item) return;
    setIsUpdating(true);
    apiPut(`/orders/${item.id}/status`, { status: newStatus })
      .then(() => {
        setCurrentStatus(newStatus);
        toast.success(`Order status updated to ${newStatus}`);
        onStatusUpdated(item.id, newStatus);
      })
      .catch((err) => {
        toast.error(err);
      })
      .finally(() => setIsUpdating(false));
  };

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Order Details — {item.id}
        <IconButton onClick={onClose} size="small" aria-label="Close dialog"><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { label: 'Customer', value: item.customer?.name ?? item.customerName ?? '—' },
            { label: 'Email',    value: item.customer?.email ?? item.email ?? '—' },
            { label: 'Product',  value: item.product ?? item.items?.[0]?.name ?? '—' },
            { label: 'Amount',   value: item.amount ? `₹${item.amount}` : '—' },
            { label: 'Date',     value: formatDate(item.createdAt ?? item.date) },
            { label: 'Address',  value: item.address ?? '—' },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', gap: 1 }}>
              <Typography component="div" variant="body2" sx={{ fontWeight: 700, minWidth: 90, color: '#1B4332' }}>{label}:</Typography>
              <Typography component="div" variant="body2">{value}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography component="div" variant="body2" sx={{ fontWeight: 700, color: '#1B4332', minWidth: 90 }}>Status:</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }} disabled={isUpdating}>
              <Select value={currentStatus} onChange={(e) => handleStatusChange(e.target.value)}>
                {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            {isUpdating && <CircularProgress size={18} />}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  // state
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableData, setTableData]           = useState([]);
  const [count, setCount]                   = useState(0);
  const [page, setPage]                     = useState(0);
  const [limit, setLimit]                   = useState(10);
  const [searchInput, setSearchInput]       = useState('');
  const [search, setSearch]                 = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [viewTarget, setViewTarget]         = useState(null);
  const debounceRef                         = useRef(null);

  // api calls
  const getData = (searchVal = search, pageVal = page, limitVal = limit, statusVal = filterStatus) => {
    setIsTableLoading(true);
    apiGet('/orders', {
      page:   pageVal + 1,
      limit:  limitVal,
      search: searchVal.trim(),
      status: statusVal || undefined,
    })
      .then((res) => {
        const { count: total, data } = res.data ?? res;
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => {
        toast.error(err);
      })
      .finally(() => setIsTableLoading(false));
  };

  const handleStatusUpdated = (orderId, newStatus) => {
    setTableData((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  // effects
  useEffect(() => {
    getData(search, page, limit, filterStatus);
  }, [page, limit, search, filterStatus]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
    }, 400);
  };

  return (
    <AdminShell>
      {/* ── Toolbar ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by order ID or customer…" value={searchInput}
          onChange={handleSearchChange} size="small"
          sx={{ flex: '1 1 220px', maxWidth: 340 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
            htmlInput: { 'aria-label': 'Search orders' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus} label="Status"
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* ── Table ── */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTableLoading ? (
                <SkeletonRows count={limit} />
              ) : tableData.length === 0 ? (
                <EmptyState search={search} />
              ) : (
                tableData.map((order, idx) => (
                  <TableRow key={order.id} hover>
                    <TableCell sx={{ color: 'text.disabled', fontSize: 13 }}>
                      {(page * limit) + idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>
                      {order.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                      {order.customer?.name ?? order.customerName ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {order.product ?? order.items?.[0]?.name ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{order.amount}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {formatDate(order.createdAt ?? order.date)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status} size="small"
                        sx={{ ...(statusColors[order.status] ?? {}), fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setViewTarget(order)} sx={{ color: '#1B4332' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          sx={{ borderTop: '1px solid #E7E5E4' }}
        />
      </Paper>

      {/* ── Modal ── */}
      <ViewModal
        open={!!viewTarget}
        order={viewTarget}
        onClose={() => setViewTarget(null)}
        onStatusUpdated={handleStatusUpdated}
      />
    </AdminShell>
  );
}
