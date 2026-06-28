/* eslint-disable react/display-name */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton, Tooltip, Chip, Stack, Avatar,
} from '@mui/material';
import {
  Search, Visibility, Edit, Cancel, FilterAltOff,
  PictureAsPdf, OpenInNew,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { usePermissions } from '@/hooks/usePermissions';
import { ordersAPI } from '@/lib/api';
import {
  ORDER_STATUS_LIST, PAYMENT_STATUS_LIST,
  capitalize, formatDate, formatAmount, isOrderCancellable,
} from '@/utils/orderUtils';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import OrderStatsBar from '@/components/orders/OrderStatsBar';
import OrderStatusPipeline from '@/components/orders/OrderStatusPipeline';
import UpdateStatusModal from '@/components/orders/UpdateStatusModal';
import CancelOrderModal from '@/components/orders/CancelOrderModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router       = useRouter();
  const { can }      = usePermissions();
  const canView      = can('order_view');
  const canUpdate    = can('order_update');
  const canCancel    = can('order_cancel');

  // ── Table state ──────────────────────────────────────────────────────────────
  const [tableData,        setTableData]        = useState([]);
  const [count,            setCount]            = useState(0);
  const [pageValue,        setPageValue]        = useState(0);
  const [limit,            setLimit]            = useState(DEFAULT_LIMIT);
  const [offset,           setOffset]           = useState(0);
  const [isTableLoading,   setIsTableLoading]   = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,           setSearch]           = useState('');
  const [isSearch,         setIsSearch]         = useState(false);
  const [filterOrderStatus,  setFilterOrderStatus]  = useState('');
  const [filterPaymentStatus,setFilterPaymentStatus]= useState('');
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats,       setStats]       = useState({ total: null, pending: null, delivered: null, revenue: null });
  const [statsLoading,setStatsLoading]= useState(false);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [openUpdate,    setOpenUpdate]    = useState(false);
  const [openCancel,    setOpenCancel]    = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // ─── Fetch stats on mount ─────────────────────────────────────────────────
  const fetchStats = () => {
    setStatsLoading(true);
    const base = { page: 1, limit: 1 };
    Promise.all([
      ordersAPI.list(base),                                          // total
      ordersAPI.list({ ...base, order_status: 'pending' }),         // pending
      ordersAPI.list({ ...base, order_status: 'delivered' }),       // delivered
      ordersAPI.list({ ...base, payment_status: 'paid', limit: 9999 }), // revenue
    ])
      .then(([total, pending, delivered, paidOrders]) => {
        // Revenue: sum total_amount of paid orders (backend should ideally provide this)
        // We request all paid orders up to 9999 to sum client-side until backend has a stats endpoint
        const revenue = (paidOrders?.data?.data ?? []).reduce(
          (sum, o) => sum + (parseFloat(o.total_amount) || 0), 0,
        );
        setStats({
          total:     total?.data?.count     ?? 0,
          pending:   pending?.data?.count   ?? 0,
          delivered: delivered?.data?.count ?? 0,
          revenue,
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  // ─── Fetch table data ─────────────────────────────────────────────────────
  const getData = (
    searchVal        = search,
    pageVal          = pageValue,
    limitVal         = limit,
    orderStatusVal   = filterOrderStatus,
    paymentStatusVal = filterPaymentStatus,
    dateFromVal      = dateFrom,
    dateToVal        = dateTo,
  ) => {
    setIsTableLoading(true);
    const params = { page: pageVal + 1, limit: limitVal };
    if (searchVal.trim())    params.search         = searchVal.trim();
    if (orderStatusVal)      params.order_status   = orderStatusVal;
    if (paymentStatusVal)    params.payment_status = paymentStatusVal;
    if (dateFromVal)         params.date_from      = dateFromVal;
    if (dateToVal)           params.date_to        = dateToVal;

    ordersAPI.list(params)
      .then((res) => {
        const { count: total, data } = res?.data ?? {};
        setTableData(data ?? []);
        setCount(total ?? 0);
      })
      .catch((err) => toast.error(err))
      .finally(() => setIsTableLoading(false));
  };

  useEffect(() => {
    fetchStats();
    getData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Debounced search ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSearch) return;
    const t = setTimeout(() => {
      setOffset(0); setPageValue(0);
      getData(search, 0, limit, filterOrderStatus, filterPaymentStatus, dateFrom, dateTo);
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleTableChange = (newPage) => {
    setOffset(newPage * limit); setPageValue(newPage);
    getData(search, newPage, limit, filterOrderStatus, filterPaymentStatus, dateFrom, dateTo);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit); setOffset(0); setPageValue(0);
    getData(search, 0, newLimit, filterOrderStatus, filterPaymentStatus, dateFrom, dateTo);
  };

  const handleOrderStatusFilter = (e) => {
    const v = e.target.value; setFilterOrderStatus(v); setOffset(0); setPageValue(0);
    getData(search, 0, limit, v, filterPaymentStatus, dateFrom, dateTo);
  };

  const handlePaymentStatusFilter = (e) => {
    const v = e.target.value; setFilterPaymentStatus(v); setOffset(0); setPageValue(0);
    getData(search, 0, limit, filterOrderStatus, v, dateFrom, dateTo);
  };

  const handleDateFrom = (e) => {
    const v = e.target.value; setDateFrom(v); setOffset(0); setPageValue(0);
    getData(search, 0, limit, filterOrderStatus, filterPaymentStatus, v, dateTo);
  };

  const handleDateTo = (e) => {
    const v = e.target.value; setDateTo(v); setOffset(0); setPageValue(0);
    getData(search, 0, limit, filterOrderStatus, filterPaymentStatus, dateFrom, v);
  };

  const handleClearFilters = () => {
    setSearch(''); setFilterOrderStatus(''); setFilterPaymentStatus('');
    setDateFrom(''); setDateTo(''); setOffset(0); setPageValue(0);
    getData('', 0, limit, '', '', '', '');
  };

  const hasFilters = search || filterOrderStatus || filterPaymentStatus || dateFrom || dateTo;

  const handleOpenUpdate = (row) => { setSelectedOrder(row); setOpenUpdate(true); };
  const handleOpenCancel = (row) => { setSelectedOrder(row); setOpenCancel(true); };

  const handleUpdated = (updated) => {
    setTableData((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o));
  };

  const handleCancelled = (id) => {
    setTableData((prev) => prev.map((o) => o.id === id ? { ...o, order_status: 'cancelled' } : o));
    fetchStats();
  };

  const handleViewInvoice = (row) => {
    window.open(ordersAPI.invoiceViewUrl(row.id), '_blank', 'noopener,noreferrer');
  };

  const handleDownloadInvoice = async (row) => {
    setDownloadingId(row.id);
    try {
      await ordersAPI.invoiceDownload(row.id);
    } catch {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloadingId(null);
    }
  };


  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      key: '#', label: '#', width: 50,
      render: (_, idx) => (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: 13 }}>{offset + idx + 1}</Typography>
      ),
    },
    {
      key: 'order_number', label: 'Order #',
      render: (row) => (
        <Typography
          variant="body2"
          onClick={() => router.push(`/orders/${row.id}`)}
          sx={{
            fontWeight: 700, color: '#1B4332', fontSize: 13,
            fontFamily: 'monospace', cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
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
      key: 'items_count', label: 'Items', align: 'center', width: 70,
      render: (row) => (
        <Chip
          label={row.items?.length ?? 0}
          size="small"
          sx={{ bgcolor: '#F1F5F0', color: '#1B4332', fontWeight: 700, fontSize: 12 }}
        />
      ),
    },
    {
      key: 'total_amount', label: 'Total', align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{formatAmount(row.total_amount)}</Typography>
      ),
    },
    {
      key: 'payment_status', label: 'Payment', align: 'center',
      render: (row) => <PaymentStatusBadge status={row.payment_status} />,
    },
    {
      key: 'order_status', label: 'Status', align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <OrderStatusBadge status={row.order_status} />
          <OrderStatusPipeline currentStatus={row.order_status} compact />
        </Box>
      ),
    },
    {
      key: 'placedAt', label: 'Placed At',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {formatDate(row.placedAt)}
        </Typography>
      ),
    },
    {
      key: 'actions', label: 'Actions', align: 'center', width: 160,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {canView && (
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => router.push(`/orders/${row.id}`)} sx={{ color: '#0369A1' }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canUpdate && (
            <Tooltip title="Update Status">
              <IconButton size="small" onClick={() => handleOpenUpdate(row)} sx={{ color: '#1B4332' }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canCancel && isOrderCancellable(row.order_status) && (
            <Tooltip title="Cancel Order">
              <IconButton size="small" onClick={() => handleOpenCancel(row)} sx={{ color: '#B91C1C' }}>
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canView && (
            <Tooltip title="View Invoice">
              <IconButton size="small" onClick={() => handleViewInvoice(row)} sx={{ color: '#7C3AED' }}>
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canView && (
            <Tooltip title="Download PDF">
              <IconButton size="small" onClick={() => handleDownloadInvoice(row)}
                disabled={downloadingId === row.id}
                sx={{ color: '#0369A1', opacity: downloadingId === row.id ? 0.5 : 1 }}>
                <PictureAsPdf fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="order_list">

      {/* ── Header + Stats inline ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332', flexShrink: 0 }}>
          Orders
          {!isTableLoading && (
            <Chip label={count} size="small" sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }} />
          )}
        </Typography>

        {/* Stats cards at the right end */}
        <OrderStatsBar stats={stats} loading={statsLoading} />
      </Box>

      {/* ── Filter bar ── */}
      <Box sx={{
        display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center',
        mb: 2.5, p: 2, bgcolor: '#fff', borderRadius: 2,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #E7E5E4',
      }}>
        {/* Search */}
        <TextInput
          size="small"
          placeholder="Search order #, name, email…"
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
          sx={{ width: 240 }}
        />

        {/* Order status filter */}
        <Select
          label="Order Status"
          value={filterOrderStatus}
          onChange={handleOrderStatusFilter}
          options={[
            { label: 'All Statuses', value: '' },
            ...ORDER_STATUS_LIST.map((s) => ({ label: capitalize(s), value: s })),
          ]}
          size="small"
          sx={{ minWidth: 150 }}
        />

        {/* Payment status filter */}
        <Select
          label="Payment"
          value={filterPaymentStatus}
          onChange={handlePaymentStatusFilter}
          options={[
            { label: 'All', value: '' },
            ...PAYMENT_STATUS_LIST.map((s) => ({ label: capitalize(s), value: s })),
          ]}
          size="small"
          sx={{ minWidth: 130 }}
        />

        {/* Date range */}
        <TextInput
          label="From"
          type="date"
          value={dateFrom}
          onChange={handleDateFrom}
          size="small"
          sx={{ width: 150 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextInput
          label="To"
          type="date"
          value={dateTo}
          onChange={handleDateTo}
          size="small"
          sx={{ width: 150 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {/* Clear filters */}
        {hasFilters && (
          <Tooltip title="Clear all filters">
            <IconButton size="small" onClick={handleClearFilters}
              sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', '&:hover': { bgcolor: '#FECACA' } }}>
              <FilterAltOff fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── Table ── */}
      <Table
        columns={columns}
        rows={tableData}
        loading={isTableLoading}
        emptyMessage={hasFilters ? 'No orders match your filters' : 'No orders yet'}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        onPageChange={handleTableChange}
        onRowsPerPageChange={handleLimitChange}
        minWidth={900}
      />

      {/* ── Modals ── */}
      <UpdateStatusModal
        open={openUpdate}
        order={selectedOrder}
        onClose={() => { setOpenUpdate(false); setSelectedOrder(null); }}
        onUpdated={(updated) => { handleUpdated(updated); setOpenUpdate(false); setSelectedOrder(null); }}
      />

      <CancelOrderModal
        open={openCancel}
        order={selectedOrder}
        onClose={() => { setOpenCancel(false); setSelectedOrder(null); }}
        onCancelled={(id) => { handleCancelled(id); setOpenCancel(false); setSelectedOrder(null); }}
      />
    </AdminShell>
  );
}
