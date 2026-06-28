'use client';

import { Box, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import { Visibility, DeleteSweep, PauseCircle } from '@mui/icons-material';
import { Table } from '@/components/ui';
import CartStatusBadge from './CartStatusBadge';
import { formatAmount, formatDateTime } from '@/utils/cartUtils';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

/**
 * CartTable — data table for the carts list page.
 * Props:
 *   rows            Array<cart>
 *   count           number
 *   page            number
 *   rowsPerPage     number
 *   loading         bool
 *   offset          number
 *   onPageChange    (page) => void
 *   onLimitChange   (limit) => void
 *   onView          (cart) => void
 *   onClearCart     (cart) => void
 *   onMarkAbandoned (cart) => void
 *   canUpdate       bool
 *   canDelete       bool
 *   hasFilters      bool
 */
export default function CartTable({
  rows = [],
  count,
  page,
  rowsPerPage,
  loading,
  offset = 0,
  onPageChange,
  onLimitChange,
  onView,
  onClearCart,
  onMarkAbandoned,
  canUpdate = false,
  canDelete = false,
  hasFilters = false,
}) {
  const columns = [
    {
      key: '#',
      label: '#',
      width: 50,
      render: (_, idx) => (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: 13 }}>
          {offset + idx + 1}
        </Typography>
      ),
    },
    {
      key: 'user',
      label: 'Customer',
      render: (row) =>
        row.user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{ width: 30, height: 30, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 10, fontWeight: 800 }}
            >
              {getInitials(row.user.name)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }} noWrap>
                {row.user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }} noWrap>
                {row.user.email}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">—</Typography>
        ),
    },
    {
      key: 'total_items',
      label: 'Items',
      align: 'center',
      width: 80,
      render: (row) => (
        <Chip
          label={row.total_items ?? 0}
          size="small"
          sx={{ bgcolor: '#F1F5F0', color: '#1B4332', fontWeight: 700, fontSize: 12 }}
        />
      ),
    },
    {
      key: 'grand_total',
      label: 'Grand Total',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
          {formatAmount(row.grand_total)}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <CartStatusBadge status={row.status} />,
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {formatDateTime(row.updatedAt)}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View Cart">
            <IconButton size="small" onClick={() => onView(row)} sx={{ color: '#0369A1' }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {canDelete && row.status === 'active' && (row.total_items ?? 0) > 0 && (
            <Tooltip title="Clear Cart">
              <IconButton size="small" onClick={() => onClearCart(row)} sx={{ color: '#B91C1C' }}>
                <DeleteSweep fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {canUpdate && row.status === 'active' && (
            <Tooltip title="Mark Abandoned">
              <IconButton size="small" onClick={() => onMarkAbandoned(row)} sx={{ color: '#475569' }}>
                <PauseCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={rows}
      loading={loading}
      emptyMessage={hasFilters ? 'No carts match your filters' : 'No carts found'}
      count={count}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onLimitChange}
      minWidth={950}
    />
  );
}
