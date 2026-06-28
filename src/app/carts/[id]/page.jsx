'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Box, Typography, Button, CircularProgress, Chip,
} from '@mui/material';
import { ArrowBack, Refresh } from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { useCartDetail } from '@/hooks/useCartDetail';
import CartDetailView from '@/components/carts/CartDetailView';
import CartStatusBadge from '@/components/carts/CartStatusBadge';

export default function CartDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const { can } = usePermissions();

  const canUpdate = can('cart_update');
  const canDelete = can('cart_delete');
  const canCreate = can('cart_create');

  const {
    cart,
    isLoading,
    error,
    summaryBusy,
    loadCart,
    handleQuantityChange,
    handleRemoveItem,
    handleClearCart,
    handleUpdateStatus,
  } = useCartDetail(id);

  useEffect(() => {
    if (id) loadCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AdminShell requiredPermission="cart_list">

      {/* ── Header bar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 3, flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined" startIcon={<ArrowBack />}
            onClick={() => router.push('/carts')}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}
            size="small"
          >
            Back
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
            Cart Detail
          </Typography>
          {cart && (
            <>
              <Chip
                label={`#${cart.id}`}
                size="small"
                sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700, fontFamily: 'monospace' }}
              />
              <CartStatusBadge status={cart.status} />
            </>
          )}
        </Box>

        {!isLoading && cart && (
          <Button
            variant="outlined" startIcon={<Refresh />}
            onClick={loadCart}
            size="small"
            sx={{ borderColor: '#E7E5E4', color: 'text.secondary' }}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* ── Content ── */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#1B4332' }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Button
            variant="outlined" onClick={loadCart}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}
          >
            Retry
          </Button>
        </Box>
      ) : cart ? (
        <CartDetailView
          cart={cart}
          summaryBusy={summaryBusy}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onUpdateStatus={handleUpdateStatus}
          onRefresh={loadCart}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canCreate={canCreate}
        />
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>Cart is empty</Typography>
          <Typography variant="body2" color="text.disabled">No items have been added to this cart yet.</Typography>
        </Box>
      )}
    </AdminShell>
  );
}
