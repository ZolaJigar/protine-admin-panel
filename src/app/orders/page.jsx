/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table, Textarea, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Stack, Alert, CircularProgress, Divider, Avatar,
  Grid,
} from '@mui/material';
import {
  Search, Visibility, Cancel, Person,
  LocalShipping, Receipt, LocationOn, ImageNotSupported,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiGet, apiPut } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 10;

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'return', 'reorder'];
const PAYMENT_STATUSES = ['pending', 'paid', 'fail', 'refunded'];

const CANCELLABLE = ['pending', 'confirmed'];

const ORDER_STATUS_COLORS = {
  pending:    { bgcolor: '#FEF3C7', color: '#92400E' },
  confirmed:  { bgcolor: '#D8F3DC', color: '#1B4332' },
  processing: { bgcolor: '#EDE9FE', color: '#7C3AED' },
  packed:     { bgcolor: '#E0F2FE', color: '#0369A1' },
  shipped:    { bgcolor: '#DBEAFE', color: '#1D4ED8' },
  delivered:  { bgcolor: '#D8F3DC', color: '#166534' },
  cancelled:  { bgcolor: '#FEE2E2', color: '#B91C1C' },
  return:     { bgcolor: '#FEF3C7', color: '#B45309' },
  reorder:    { bgcolor: '#F3E8FF', color: '#7C3AED' },
};

const PAYMENT_STATUS_COLORS = {
  pending:  { bgcolor: '#FEF3C7', color: '#92400E' },
  paid:     { bgcolor: '#D8F3DC', color: '#1B4332' },
  fail:     { bgcolor: '#FEE2E2', color: '#B91C1C' },
  refunded: { bgcolor: '#E0F2FE', color: '#0369A1' },
};

function capitalize(str) {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatAmount(val) {
  if (val === null || val === undefined || val === '') return '—';
  return '₹' + Number(val).toFixed(2);
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ─── OrderStatusChip ──────────────────────────────────────────────────────────
function OrderStatusChip({ status }) {
  return (
    <Chip
      label={capitalize(status)}
      size="small"
      sx={{ ...(ORDER_STATUS_COLORS[status] ?? {}), fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
    />
  );
}

function PaymentStatusChip({ status }) {
  return (
    <Chip
      label={capitalize(status)}
      size="small"
      sx={{ ...(PAYMENT_STATUS_COLORS[status] ?? {}), fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
    />
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({ open, order, onClose, onCancelled }) {
  const [reason, setReason]         = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const ref = useRef(order);
  if (order) ref.current = order;
  const item = ref.current;

  useEffect(() => {
    if (open) { setReason(''); setReasonError(''); }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim())         { setReasonError('Reason is required'); return; }
    if (reason.trim().length < 3) { setReasonError('Minimum 3 characters'); return; }
    if (reason.trim().length > 500) { setReasonError('Maximum 500 characters'); return; }

    setIsLoading(true);
    apiPut(`/orders/cancel/${item.id}`, { cancellation_reason: reason.trim() })
      .then((res) => {
        toast.success('Order cancelled successfully.');
        onCancelled(item.id, res?.data);
        onClose();
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsLoading(false));
  };

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} title="Cancel Order" maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Cancelling <strong>{item.order_number}</strong>. Stock will be automatically restored.
          </Alert>
          <Textarea
            label="Cancellation Reason *"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setReasonError(''); }}
            error={reasonError}
            rows={3}
            required
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Back</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 120 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Cancel Order'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ open, orderId, onClose, onCancelled, canCancel: canCancelProp = true }) {
  const [order, setOrder]       = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      setIsLoading(true);
      setOrder(null);
      apiGet(`/orders/admin/detail/${orderId}`)
        .then((res) => setOrder(res?.data ?? res))
        .catch((err) => toast.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [open, orderId]);

  const handleCancelled = (id, updated) => {
    if (updated) setOrder((prev) => ({ ...prev, ...updated }));
    onCancelled?.(id, updated);
  };

  const canCancel = canCancelProp && order && CANCELLABLE.includes(order.order_status);

  return (
    <>
      <Modal open={open} onClose={onClose} title="Order Details" maxWidth="md"
        actions={<>
          {canCancel && (
            <Button variant="outlined" startIcon={<Cancel />}
              onClick={() => setOpenCancel(true)}
              sx={{ color: '#B91C1C', borderColor: '#B91C1C' }}>
              Cancel Order
            </Button>
          )}
          <Button variant="outlined" onClick={onClose}>Close</Button>
        </>}
      >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !order ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Failed to load order.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* ── Header row ── */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1B4332' }}>{order.order_number}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDateTime(order.placedAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <OrderStatusChip status={order.order_status} />
                  <PaymentStatusChip status={order.payment_status} />
                </Box>
              </Box>

              <Divider />

              {/* ── Customer ── */}
              {order.user && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Person sx={{ fontSize: 16, color: '#1B4332' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>Customer</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 0.5 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 13, fontWeight: 800 }}>
                      {getInitials(order.user.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{order.user.email}</Typography>
                      {order.user.phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>· {order.user.phone}</Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* ── Amounts ── */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Receipt sx={{ fontSize: 16, color: '#1B4332' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>Payment Summary</Typography>
                </Box>
                <Box sx={{ bgcolor: '#F8FBF8', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {[
                    { label: 'Subtotal',  value: formatAmount(order.subtotal_amount) },
                    { label: 'Discount',  value: formatAmount(order.discount_amount) },
                    { label: 'Shipping',  value: formatAmount(order.shipping_amount) },
                    { label: 'Tax',       value: formatAmount(order.tax_amount) },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2">{value}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>Total</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#1B4332' }}>{formatAmount(order.total_amount)}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* ── Items ── */}
              {order.items?.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <LocalShipping sx={{ fontSize: 16, color: '#1B4332' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>
                      Items ({order.items.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {order.items.map((item) => {
                      const img = item.productVariant?.image || item.product?.image;
                      return (
                        <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#F8FBF8', borderRadius: 2, p: 1.5 }}>
                          {/* thumbnail */}
                          {img ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={img} alt={item.product_name}
                              style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid #E7E5E4', flexShrink: 0 }} />
                          ) : (
                            <Avatar variant="rounded" sx={{ width: 52, height: 52, bgcolor: '#F1F5F0', color: '#A8A29E', flexShrink: 0 }}>
                              <ImageNotSupported fontSize="small" />
                            </Avatar>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.variant_name}</Typography>
                            {item.sku && (
                              <Chip label={item.sku} size="small" variant="outlined"
                                sx={{ ml: 1, fontFamily: 'monospace', fontSize: 10, height: 18 }} />
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatAmount(item.line_total)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatAmount(item.unit_price)} × {item.quantity}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* ── Delivery Address ── */}
              {order.address && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: '#1B4332' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>Delivery Address</Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#F8FBF8', borderRadius: 2, p: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.address.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{order.address.mobile}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[order.address.address_line_1, order.address.address_line_2].filter(Boolean).join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[order.address.postal_code].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* ── Cancellation reason ── */}
              {order.order_status === 'cancelled' && order.cancellation_reason && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>Cancellation Reason</Typography>
                  <Typography variant="body2">{order.cancellation_reason}</Typography>
                  {order.cancelledAt && (
                    <Typography variant="caption" color="inherit" sx={{ opacity: 0.75 }}>
                      · {formatDateTime(order.cancelledAt)}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* ── Notes ── */}
              {order.notes && (
                <Box sx={{ bgcolor: '#FEF9C3', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E' }}>Note</Typography>
                  <Typography variant="body2" color="text.secondary">{order.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
      </Modal>

      <CancelModal
        open={openCancel}
        order={order}
        onClose={() => setOpenCancel(false)}
        onCancelled={handleCancelled}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { can } = usePermissions();
  const canCancel = can('order_cancel');
  const canView   = can('order_detail');
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableData, setTableData]           = useState([]);
  const [count, setCount]                   = useState(0);
  const [pageValue, setPageValue]           = useState(0);
  const [limit, setLimit]                   = useState(DEFAULT_LIMIT);
  const [offset, setOffset]                 = useState(0);
  const [search, setSearch]                 = useState('');
  const [isSearch, setIsSearch]             = useState(false);
  const [filterOrderStatus, setFilterOrderStatus]     = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [viewId, setViewId]                 = useState(null);
  const [openView, setOpenView]             = useState(false);

  const getData = (
    searchVal       = search,
    pageVal         = pageValue,
    limitVal        = limit,
    orderStatusVal  = filterOrderStatus,
    paymentStatusVal = filterPaymentStatus,
  ) => {
    setIsTableLoading(true);
    const params = {
      page:  pageVal + 1,
      limit: limitVal,
    };
    if (searchVal.trim())    params.search         = searchVal.trim();
    if (orderStatusVal)      params.order_status   = orderStatusVal;
    if (paymentStatusVal)    params.payment_status = paymentStatusVal;

    apiGet('/orders/admin/list', params)
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
        setOffset(0); setPageValue(0);
        getData(search, 0, limit, filterOrderStatus, filterPaymentStatus);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [search]);

  const handleTableChange = (newPage) => {
    setOffset(newPage * limit);
    setPageValue(newPage);
    getData(search, newPage, limit, filterOrderStatus, filterPaymentStatus);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
    setPageValue(0);
    getData(search, 0, newLimit, filterOrderStatus, filterPaymentStatus);
  };

  const handleOrderStatusFilter = (e) => {
    const val = e.target.value;
    setFilterOrderStatus(val); setOffset(0); setPageValue(0);
    getData(search, 0, limit, val, filterPaymentStatus);
  };

  const handlePaymentStatusFilter = (e) => {
    const val = e.target.value;
    setFilterPaymentStatus(val); setOffset(0); setPageValue(0);
    getData(search, 0, limit, filterOrderStatus, val);
  };

  const handleCancelled = (id, updated) => {
    setTableData((prev) =>
      prev.map((o) => o.id === id ? { ...o, order_status: 'cancelled', ...updated } : o)
    );
  };

  const handleOpenView = (row) => { setViewId(row.id); setOpenView(true); };
  const handleCloseView = () => { setOpenView(false); setViewId(null); };

  // ─── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (_, idx) => (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: 13 }}>
          {offset + idx + 1}
        </Typography>
      ),
    },
    {
      key: 'order_number', label: 'Order #',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13, fontFamily: 'monospace' }}>
          {row.order_number}
        </Typography>
      ),
    },
    {
      key: 'user', label: 'Customer',
      render: (row) => row.user ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 10, fontWeight: 800 }}>
            {getInitials(row.user.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{row.user.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{row.user.email}</Typography>
          </Box>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">—</Typography>,
    },
    {
      key: 'total_amount', label: 'Total',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatAmount(row.total_amount)}</Typography>
      ),
    },
    {
      key: 'payment_status', label: 'Payment', align: 'center',
      render: (row) => <PaymentStatusChip status={row.payment_status} />,
    },
    {
      key: 'order_status', label: 'Status', align: 'center',
      render: (row) => <OrderStatusChip status={row.order_status} />,
    },
    {
      key: 'placedAt', label: 'Placed',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {formatDate(row.placedAt)}
        </Typography>
      ),
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 80,
      render: (row) => (
        canView ? (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => handleOpenView(row)} sx={{ color: '#0369A1' }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        ) : null
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="order_list">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
          Orders
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            label="Order Status"
            value={filterOrderStatus}
            onChange={handleOrderStatusFilter}
            options={[
              { label: 'All Statuses', value: '' },
              ...ORDER_STATUSES.map((s) => ({ label: capitalize(s), value: s })),
            ]}
            size="small"
            sx={{ minWidth: 160 }}
          />
          <Select
            label="Payment"
            value={filterPaymentStatus}
            onChange={handlePaymentStatusFilter}
            options={[
              { label: 'All', value: '' },
              ...PAYMENT_STATUSES.map((s) => ({ label: capitalize(s), value: s })),
            ]}
            size="small"
            sx={{ minWidth: 130 }}
          />
          <TextInput
            placeholder="Search by order number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsSearch(true); }}
            size="small"
            sx={{ width: 260 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={search ? `No orders found for "${search}"` : 'No orders yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={800}
      />

      {/* ── View Modal ── */}
      <ViewModal
        open={openView}
        orderId={viewId}
        onClose={handleCloseView}
        onCancelled={handleCancelled}
        canCancel={canCancel}
      />
    </AdminShell>
  );
}
