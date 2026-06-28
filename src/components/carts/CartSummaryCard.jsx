'use client';

import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { formatAmount } from '@/utils/cartUtils';

/**
 * CartSummaryCard — right-aligned totals breakdown for a cart.
 * Props:
 *   cart       object  — full cart object with subtotal_amount, discount_amount, etc.
 *   loading    bool    — shows spinner over the totals while an API call is in-flight
 */
export default function CartSummaryCard({ cart, loading = false }) {
  if (!cart) return null;

  const rows = [
    { label: 'Subtotal',  value: cart.subtotal_amount,  color: 'text.primary' },
    { label: 'Discount',  value: `-${formatAmount(cart.discount_amount)}`, raw: true, color: '#166534' },
    { label: 'Tax',       value: cart.tax_amount,       color: 'text.primary' },
    { label: 'Shipping',  value: cart.shipping_amount,  color: 'text.primary' },
  ];

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.65)', borderRadius: 2, zIndex: 1,
        }}>
          <CircularProgress size={24} sx={{ color: '#1B4332' }} />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {rows.map(({ label, value, raw, color }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color }}>
              {raw ? value : formatAmount(value)}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 0.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1B4332' }}>
            Grand Total
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 900, color: '#1B4332' }}>
            {formatAmount(cart.grand_total)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">Total Items</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {cart.total_items ?? 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
