'use client';

import { Chip } from '@mui/material';
import { CART_STATUS_COLORS, capitalize } from '@/utils/cartUtils';

/**
 * CartStatusBadge — colored Chip for cart status.
 * Props: status string, size 'small'|'medium'
 */
export default function CartStatusBadge({ status, size = 'small' }) {
  const colors = CART_STATUS_COLORS[status] ?? { bgcolor: '#F1F5F9', color: '#475569' };
  return (
    <Chip
      label={capitalize(status)}
      size={size}
      sx={{ ...colors, fontWeight: 700, fontSize: size === 'small' ? 11 : 13, borderRadius: 1.5 }}
    />
  );
}
