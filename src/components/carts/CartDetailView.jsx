'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Grid, Chip,
  CircularProgress, Alert, Divider, Avatar,
} from '@mui/material';
import {
  Person, OpenInNew, ShoppingBag, DeleteSweep,
  PauseCircle, Add,
} from '@mui/icons-material';
import CartStatusBadge from './CartStatusBadge';
import CartItemsTable from './CartItemsTable';
import CartSummaryCard from './CartSummaryCard';
import ClearCartConfirm from './ClearCartConfirm';
import AddItemModal from './AddItemModal';
import { formatDateTime, formatDate } from '@/utils/cartUtils';

/**
 * CartDetailView — full detail view for a single cart.
 * Props:
 *   cart                object
 *   summaryBusy         bool
 *   onQuantityChange    (cartItemId, qty) => void
 *   onRemoveItem        (cartItemId, onDone) => void
 *   onClearCart         (onDone) => void
 *   onUpdateStatus      (status, onDone) => void
 *   onRefresh           () => void
 *   canUpdate           bool
 *   canDelete           bool
 *   canCreate           bool
 */
export default function CartDetailView({
  cart,
  summaryBusy = false,
  onQuantityChange,
  onRemoveItem,
  onClearCart,
  onUpdateStatus,
  onRefresh,
  canUpdate = false,
  canDelete = false,
  canCreate = false,
}) {
  const router = useRouter();

  const [openClear,   setOpenClear]   = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);

  const handleConfirmClear = () => {
    setClearLoading(true);
    onClearCart(() => {
      setClearLoading(false);
      setOpenClear(false);
    });
  };

  const handleAddItemSuccess = () => {
    onRefresh();
  };

  const isActive = cart.status === 'active';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── SECTION 1: Cart Header ─────────────────────────────────────── */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1B4332', fontFamily: 'monospace' }}>
                Cart #{cart.id}
              </Typography>
              <CartStatusBadge status={cart.status} size="medium" />
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Created</Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>{formatDateTime(cart.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Last Updated</Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>{formatDateTime(cart.updatedAt)}</Typography>
              </Box>
              {cart.expiresAt && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Expires At</Typography>
                  <Typography variant="body2" sx={{ fontSize: 13, color: '#B91C1C' }}>{formatDate(cart.expiresAt)}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {canCreate && isActive && (
            <Button
              variant="outlined" startIcon={<Add />}
              onClick={() => setOpenAddItem(true)}
              sx={{ borderColor: '#1B4332', color: '#1B4332' }}
              size="small"
            >
              Add Item
            </Button>
          )}
        </Box>
      </Paper>

      {/* ── SECTION 2 + SUMMARY: Customer + Totals ────────────────────── */}
      <Grid container spacing={2}>
        {/* Customer info */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person sx={{ fontSize: 18, color: '#1B4332' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>Customer</Typography>
            </Box>
            {cart.user ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar
                    sx={{ width: 44, height: 44, bgcolor: '#1B4332', color: '#F59E0B', fontWeight: 800, fontSize: 16 }}
                  >
                    {(cart.user.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{cart.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{cart.user.email}</Typography>
                    {cart.user.phone && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{cart.user.phone}</Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small" variant="outlined" endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                    onClick={() => router.push('/users')}
                    sx={{ fontSize: 12, borderColor: '#1B4332', color: '#1B4332' }}
                  >
                    View User
                  </Button>
                  <Button
                    size="small" variant="outlined" endIcon={<ShoppingBag sx={{ fontSize: 13 }} />}
                    onClick={() => router.push(`/orders?user_id=${cart.user_id}`)}
                    sx={{ fontSize: 12, borderColor: '#0369A1', color: '#0369A1' }}
                  >
                    View Orders
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">No customer info</Typography>
            )}
          </Paper>
        </Grid>

        {/* Cart summary */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>
              Cart Summary
            </Typography>
            <CartSummaryCard cart={cart} loading={summaryBusy} />
          </Paper>
        </Grid>
      </Grid>

      {/* ── SECTION 3: Cart Items Table ────────────────────────────────── */}
      <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>
          Cart Items ({cart.items?.length ?? 0})
        </Typography>
        <CartItemsTable
          items={cart.items ?? []}
          onQuantityChange={onQuantityChange}
          onRemoveItem={onRemoveItem}
          cartStatus={cart.status}
        />
      </Paper>

      {/* ── SECTION 4: Admin Actions ───────────────────────────────────── */}
      {(canUpdate || canDelete || isActive) && (
        <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>
            Admin Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>

            {canDelete && isActive && (
              <Button
                variant="outlined" startIcon={<DeleteSweep />}
                onClick={() => setOpenClear(true)}
                sx={{ color: '#B91C1C', borderColor: '#B91C1C', '&:hover': { bgcolor: '#FEE2E2' } }}
              >
                Clear Cart
              </Button>
            )}

            {canUpdate && isActive && (
              <Button
                variant="outlined" startIcon={<PauseCircle />}
                onClick={() => onUpdateStatus('abandoned')}
                sx={{ color: '#475569', borderColor: '#CBD5E1', '&:hover': { bgcolor: '#F1F5F9' } }}
              >
                Mark as Abandoned
              </Button>
            )}

            {isActive && cart.user_id && (
              <Button
                variant="contained" startIcon={<ShoppingBag />}
                onClick={() => router.push(`/orders?user_id=${cart.user_id}&cart_id=${cart.id}`)}
                sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
              >
                Proceed to Order
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <ClearCartConfirm
        open={openClear}
        cart={cart}
        onClose={() => setOpenClear(false)}
        onConfirm={handleConfirmClear}
        loading={clearLoading}
      />

      <AddItemModal
        open={openAddItem}
        onClose={() => setOpenAddItem(false)}
        onAdded={handleAddItemSuccess}
        prefillUserId={cart.user_id}
      />
    </Box>
  );
}
