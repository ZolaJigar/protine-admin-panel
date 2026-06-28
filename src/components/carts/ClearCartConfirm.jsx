'use client';

import { useState } from 'react';
import { Typography, Button, CircularProgress, Box } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { Modal } from '@/components/ui';

/**
 * ClearCartConfirm — destructive confirmation dialog for clearing all cart items.
 * Props:
 *   open        bool
 *   cart        object|null  — { id, total_items }
 *   onClose     () => void
 *   onConfirm   () => void  — caller performs the actual API call
 *   loading     bool
 */
export default function ClearCartConfirm({ open, cart, onClose, onConfirm, loading = false }) {
  const ref = { current: cart };

  if (!open && !cart) return null;

  return (
    <Modal open={open} onClose={onClose} title="Clear Cart" maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%', bgcolor: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <WarningAmber sx={{ color: '#B91C1C', fontSize: 32 }} />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Are you sure?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will remove all{' '}
            <strong>{cart?.total_items ?? 0} item{(cart?.total_items ?? 0) !== 1 ? 's' : ''}</strong>{' '}
            from this cart. This action cannot be undone.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', mt: 1 }}>
          <Button
            variant="outlined" onClick={onClose} disabled={loading}
            fullWidth sx={{ borderColor: '#E7E5E4' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" onClick={onConfirm} disabled={loading}
            fullWidth sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' } }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Clear Cart'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
