'use client';

import { Chip } from '@mui/material';
import { PAYMENT_STATUS_COLORS, capitalize } from '@/utils/orderUtils';

/**
 * PaymentStatusBadge — colored Chip for payment_status.
 * Props: status string, size 'small'|'medium' (default 'small')
 */
export default function PaymentStatusBadge({ status, size = 'small' }) {
  const colors = PAYMENT_STATUS_COLORS[status] ?? { bgcolor: '#F3F4F6', color: '#374151' };
  return (
    <Chip
      label={capitalize(status)}
      size={size}
      sx={{ ...colors, fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
    />
  );
}
