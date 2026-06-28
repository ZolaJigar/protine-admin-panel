'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Alert } from '@mui/material';
import { Modal, Textarea } from '@/components/ui';
import { ordersAPI } from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * CancelOrderModal
 * Props:
 *   open        bool
 *   order       object|null  — { id, order_number }
 *   onClose     () => void
 *   onCancelled (id, updatedOrder) => void
 */
export default function CancelOrderModal({ open, order, onClose, onCancelled }) {
  const ref = useRef(order);
  if (order) ref.current = order;
  const item = ref.current;

  const [reason,      setReason]      = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  useEffect(() => {
    if (open) { setReason(''); setReasonError(''); }
  }, [open]);

  if (!item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim())               { setReasonError('Cancellation reason is required.'); return; }
    if (reason.trim().length < 10)    { setReasonError('Please provide at least 10 characters.'); return; }
    if (reason.trim().length > 500)   { setReasonError('Maximum 500 characters allowed.'); return; }

    setIsLoading(true);
    ordersAPI.cancel(item.id, { cancellation_reason: reason.trim() })
      .then((res) => {
        toast.success('Order cancelled successfully.');
        onCancelled(item.id, res?.data);
        onClose();
      })
      .catch((err) => {
        const msg = typeof err === 'string' ? err : 'Failed to cancel order.';
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Cancel Order" maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            You are about to cancel order <strong>{item.order_number}</strong>. This action cannot be undone.
          </Alert>
          <Textarea
            label="Cancellation Reason *"
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(''); }}
            error={reasonError}
            rows={3}
            placeholder="Provide a reason (min 10 characters)"
            required
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Back</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Cancel Order'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
