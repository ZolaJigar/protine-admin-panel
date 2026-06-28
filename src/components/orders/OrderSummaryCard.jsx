'use client';

import { Box, Typography, Divider } from '@mui/material';
import { formatAmount } from '@/utils/orderUtils';

/**
 * OrderSummaryCard — subtotal / discount / shipping / tax / total breakdown.
 * Props: subtotal, discount, shipping, tax, total (all string|number)
 */
export default function OrderSummaryCard({ subtotal, discount, shipping, tax, total }) {
  return (
    <Box sx={{ bgcolor: '#F8FBF8', borderRadius: 2, p: 2.5, border: '1px solid #E7E5E4', minWidth: 240 }}>
      {[
        { label: 'Subtotal',  value: formatAmount(subtotal) },
        { label: 'Discount',  value: `−${formatAmount(discount)}`, color: '#166534' },
        { label: 'Shipping',  value: formatAmount(shipping) },
        { label: 'Tax',       value: formatAmount(tax) },
      ].map(({ label, value, color }) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: color || 'text.primary' }}>{value}</Typography>
        </Box>
      ))}
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 15 }}>Total</Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 15, color: '#1B4332' }}>{formatAmount(total)}</Typography>
      </Box>
    </Box>
  );
}
