'use client';

import { Box, Typography } from '@mui/material';
import { ShoppingBag, CheckCircle, Cancel, Loop } from '@mui/icons-material';
import { formatDateTime } from '@/utils/orderUtils';

/**
 * OrderTimeline — vertical key-timestamp timeline.
 * Props: placedAt, deliveredAt, cancelledAt, order_status (all from order object)
 */
export default function OrderTimeline({ placedAt, deliveredAt, cancelledAt, order_status }) {
  const events = [
    {
      icon:  <ShoppingBag sx={{ fontSize: 15 }} />,
      label: 'Order placed',
      value: formatDateTime(placedAt),
      active: !!placedAt,
      color: '#1B4332',
    },
    {
      icon:  <CheckCircle sx={{ fontSize: 15 }} />,
      label: 'Delivered',
      value: deliveredAt ? formatDateTime(deliveredAt) : '—',
      active: !!deliveredAt || order_status === 'delivered',
      color: '#166534',
    },
    ...(order_status === 'cancelled' || cancelledAt ? [{
      icon:  <Cancel sx={{ fontSize: 15 }} />,
      label: 'Cancelled',
      value: cancelledAt ? formatDateTime(cancelledAt) : '—',
      active: !!cancelledAt,
      color: '#B91C1C',
    }] : []),
    ...(order_status === 'return' ? [{
      icon:  <Loop sx={{ fontSize: 15 }} />,
      label: 'Returned',
      value: '—',
      active: true,
      color: '#C2410C',
    }] : []),
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((ev, idx) => (
        <Box key={ev.label} sx={{ display: 'flex', gap: 1.5 }}>
          {/* Icon + connector */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              bgcolor: ev.active ? `${ev.color}18` : '#F3F4F6',
              color: ev.active ? ev.color : '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ev.icon}
            </Box>
            {idx < events.length - 1 && (
              <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: '#E5E7EB', my: 0.25 }} />
            )}
          </Box>
          {/* Text */}
          <Box sx={{ pb: idx < events.length - 1 ? 1.5 : 0, pt: 0.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, color: ev.active ? 'text.primary' : 'text.disabled' }}>
              {ev.label}
            </Typography>
            <Typography variant="caption" sx={{ color: ev.active ? 'text.secondary' : 'text.disabled' }}>
              {ev.value}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
