'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Modal, Select, Textarea } from '@/components/ui';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';
import { getAllowedNextStatuses, PAYMENT_STATUS_LIST, capitalize } from '@/utils/orderUtils';
import { ordersAPI } from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * UpdateStatusModal
 * Props:
 *   open      bool
 *   order     object|null  — { id, order_number, order_status, payment_status, notes }
 *   onClose   () => void
 *   onUpdated (updatedOrder) => void
 */
export default function UpdateStatusModal({ open, order, onClose, onUpdated }) {
  const ref = useRef(order);
  if (order) ref.current = order;
  const item = ref.current;

  const [orderStatus,   setOrderStatus]   = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [notes,         setNotes]         = useState('');
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (open && item) {
      setOrderStatus('');
      setPaymentStatus(item.payment_status || '');
      setNotes(item.notes || '');
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!item) return null;

  const allowed = getAllowedNextStatuses(item.order_status);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const body = {};
    if (orderStatus && orderStatus !== item.order_status) body.order_status   = orderStatus;
    if (paymentStatus !== item.payment_status)            body.payment_status = paymentStatus;
    if (notes !== (item.notes || ''))                     body.notes          = notes;

    if (!Object.keys(body).length) { setError('No changes to save.'); return; }

    setIsLoading(true);
    ordersAPI.updateStatus(item.id, body)
      .then((res) => {
        toast.success('Order updated successfully.');
        onUpdated(res?.data ?? { ...item, ...body });
        onClose();
      })
      .catch((err) => {
        const msg = typeof err === 'string' ? err : 'Failed to update order.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal open={open} onClose={onClose} title="Update Order Status" maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Current state summary */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#F8FBF8', borderRadius: 2, p: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase' }}>
                Order
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{item.order_number}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase' }}>
                Current Status
              </Typography>
              <Box sx={{ mt: 0.25 }}><OrderStatusBadge status={item.order_status} /></Box>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase' }}>
                Payment
              </Typography>
              <Box sx={{ mt: 0.25 }}><PaymentStatusBadge status={item.payment_status} /></Box>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          {/* Order status — only allowed transitions */}
          {allowed.length > 0 ? (
            <Select
              label="Move to Status"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              options={[
                { label: '— Keep current —', value: '' },
                ...allowed.map((s) => ({ label: capitalize(s), value: s })),
              ]}
              fullWidth
            />
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No further status transitions available for this order.
            </Alert>
          )}

          {/* Payment status */}
          <Select
            label="Payment Status"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            options={PAYMENT_STATUS_LIST.map((s) => ({ label: capitalize(s), value: s }))}
            fullWidth
          />

          {/* Notes */}
          <Textarea
            label="Admin Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Dispatched via FedEx, tracking #ABC123"
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}
            sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', minWidth: 130 }}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
