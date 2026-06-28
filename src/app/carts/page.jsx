/* eslint-disable react/display-name */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select } from '@/components/ui';
import {
  Box, Typography, InputAdornment,
  IconButton, Tooltip, Chip,
} from '@mui/material';
import { Search, FilterAltOff } from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { useCarts } from '@/hooks/useCarts';
import CartStatsBar from '@/components/carts/CartStatsBar';
import CartTable from '@/components/carts/CartTable';
import ClearCartConfirm from '@/components/carts/ClearCartConfirm';
import { CART_STATUS_LIST, capitalize } from '@/utils/cartUtils';

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CartsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { can }      = usePermissions();

  const canUpdate = can('cart_update');
  const canDelete = can('cart_delete');

  // Pre-filter by user_id if coming from users module
  const initialUserId = searchParams.get('user_id')
    ? Number(searchParams.get('user_id'))
    : null;

  const {
    tableData, count, pageValue, limit, offset, isTableLoading,
    search, setSearch, filterStatus, userId,
    isSearch, setIsSearch, hasFilters,
    stats, statsLoading,
    handlePageChange, handleLimitChange, handleStatusFilter,
    handleClearFilters, handleClearCart, handleMarkAbandoned,
  } = useCarts(initialUserId);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [clearTarget,  setClearTarget]  = useState(null);
  const [clearLoading, setClearLoading] = useState(false);

  // ── Confirm clear cart ─────────────────────────────────────────────────────
  const handleConfirmClear = () => {
    if (!clearTarget) return;
    setClearLoading(true);
    handleClearCart(clearTarget.id, () => {
      setClearLoading(false);
      setClearTarget(null);
    });
  };

  return (
    <AdminShell requiredPermission="cart_list">

      {/* ── Header + Stats inline ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332', flexShrink: 0 }}>
          Carts
          {!isTableLoading && (
            <Chip
              label={count}
              size="small"
              sx={{ ml: 1.5, bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700 }}
            />
          )}
          {userId && (
            <Chip
              label={`User #${userId}`}
              size="small"
              onDelete={handleClearFilters}
              sx={{ ml: 1, bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600 }}
            />
          )}
        </Typography>

        {/* Stats cards at the right end */}
        <CartStatsBar stats={stats} loading={statsLoading} />
      </Box>

      {/* ── Filter bar ── */}
      <Box sx={{
        display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center',
        mb: 2.5, p: 2, bgcolor: '#fff', borderRadius: 2,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #E7E5E4',
      }}>
        <TextInput
          size="small"
          placeholder="Search customer name or email…"
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
          sx={{ width: 260 }}
        />

        <Select
          label="Status"
          value={filterStatus}
          onChange={(e) => handleStatusFilter(e.target.value)}
          options={[
            { label: 'All Statuses', value: '' },
            ...CART_STATUS_LIST.map((s) => ({ label: capitalize(s), value: s })),
          ]}
          size="small"
          sx={{ minWidth: 150 }}
        />

        {hasFilters && (
          <Tooltip title="Clear all filters">
            <IconButton
              size="small" onClick={handleClearFilters}
              sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', '&:hover': { bgcolor: '#FECACA' } }}
            >
              <FilterAltOff fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── Table ── */}
      <CartTable
        rows={tableData}
        count={count}
        page={pageValue}
        rowsPerPage={limit}
        loading={isTableLoading}
        offset={offset}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onView={(row) => router.push(`/carts/${row.id}`)}
        onClearCart={(row) => setClearTarget(row)}
        onMarkAbandoned={(row) => handleMarkAbandoned(row.id)}
        canUpdate={canUpdate}
        canDelete={canDelete}
        hasFilters={!!hasFilters}
      />

      {/* ── Clear Cart Confirm ── */}
      <ClearCartConfirm
        open={!!clearTarget}
        cart={clearTarget}
        onClose={() => setClearTarget(null)}
        onConfirm={handleConfirmClear}
        loading={clearLoading}
      />
    </AdminShell>
  );
}
