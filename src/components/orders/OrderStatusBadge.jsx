'use client';

import { Chip } from '@mui/material';
import { ORDER_STATUS_COLORS, capitalize } from '@/utils/orderUtils';

/**
 * OrderStatusBadge — colored Chip for order_status.
 * Props: status string, size 'small'|'medium' (default 'small')
 */
export default function OrderStatusBadge({ status, size = 'small' }) {
  const colors = ORDER_STATUS_COLORS[status] ?? { bgcolor: '#F3F4F6', color: '#374151' };
  return (
    <Chip
      label={capitalize(status)}
      size={size}
      sx={{ ...colors, fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
    />
  );
}
