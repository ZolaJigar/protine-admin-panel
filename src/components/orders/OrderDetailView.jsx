'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Chip, Paper, Divider, Avatar,
  CircularProgress, Alert, Grid,
} from '@mui/material';
import {
  Person, LocationOn, Edit, Cancel, OpenInNew, PictureAsPdf,
} from '@mui/icons-material';
import { Textarea } from '@/components/ui';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';
import OrderStatusPipeline from './OrderStatusPipeline';
import OrderItemsTable from './OrderItemsTable';
import OrderSummaryCard from './OrderSummaryCard';
import OrderTimeline from './OrderTimeline';
import UpdateStatusModal from './UpdateStatusModal';
import CancelOrderModal from './CancelOrderModal';
import { isOrderCancellable, formatDateTime, formatDate } from '@/utils/orderUtils';
import { ordersAPI } from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * OrderDetailView — full detail view used inside the [id] page.
 * Props:
 *   order       object        — full order object
 *   onOrderUpdate (updated) => void   — called when order mutated
 *   canUpdate   bool
 *   canCancel   bool
 */
export default function OrderDetailView({ order, onOrderUpdate, canUpdate = false, canCancel = false }) {
  const router = useRouter();

  const [openUpdate,  setOpenUpdate]  = useState(false);
  const [openCancel,  setOpenCancel]  = useState(false);
  const [notes,       setNotes]       = useState(order.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cancellable = isOrderCancellable(order.order_status);

  const handleViewInvoice = () => {
    window.open(ordersAPI.invoiceViewUrl(order.id), '_blank', 'noopener,noreferrer');
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await ordersAPI.invoiceDownload(order.id);
    } catch {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloading(false);
    }
  };

  const ADDRESS_TYPE_LABEL = {
    home: 'Home', office: 'Office', resident: 'Resident', other: 'Other',
  };

  const handleNotesSave = () => {
    if (notes === (order.notes || '')) { toast.info('No changes to save.'); return; }
    setSavingNotes(true);
    ordersAPI.updateStatus(order.id, { notes: notes.trim() || null })
      .then((res) => {
        toast.success('Notes saved.');
        onOrderUpdate(res?.data ?? { ...order, notes: notes.trim() || null });
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to save notes.'))
      .finally(() => setSavingNotes(false));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── SECTION 1: Header ── */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B4332', fontFamily: 'monospace', letterSpacing: 1 }}>
              {order.order_number}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Placed: {formatDateTime(order.placedAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <OrderStatusBadge status={order.order_status} size="medium" />
            <PaymentStatusBadge status={order.payment_status} size="medium" />
          </Box>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Order Progress
          </Typography>
          <OrderStatusPipeline currentStatus={order.order_status} />
        </Box>
      </Paper>

      {/* ── SECTION 2: Customer + Address ── */}
      <Grid container spacing={2}>
        {/* Customer card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person sx={{ fontSize: 18, color: '#1B4332' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>Customer</Typography>
            </Box>
            {order.user ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#1B4332', color: '#F59E0B', fontWeight: 800, fontSize: 14 }}>
                    {(order.user.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.user.email}</Typography>
                    {order.user.phone && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{order.user.phone}</Typography>
                    )}
                  </Box>
                </Box>
                <Button
                  size="small" variant="outlined" endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                  onClick={() => router.push('/users')}
                  sx={{ fontSize: 12, borderColor: '#1B4332', color: '#1B4332' }}
                >
                  View User
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">No customer info</Typography>
            )}
          </Paper>
        </Grid>

        {/* Address card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn sx={{ fontSize: 18, color: '#1B4332' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>Delivery Address</Typography>
            </Box>
            {order.address ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {order.address.address_type && (
                  <Chip
                    label={ADDRESS_TYPE_LABEL[order.address.address_type] ?? order.address.address_type}
                    size="small"
                    sx={{ alignSelf: 'flex-start', mb: 0.5, bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: 11 }}
                  />
                )}
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.address.name}</Typography>
                <Typography variant="body2" color="text.secondary">{order.address.mobile}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {[order.address.address_line_1, order.address.address_line_2].filter(Boolean).join(', ')}
                </Typography>
                {order.address.landmark && (
                  <Typography variant="body2" color="text.secondary">Near: {order.address.landmark}</Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {[
                    order.address.city?.name,
                    order.address.state?.name,
                    order.address.country?.name,
                    order.address.postal_code,
                  ].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">No address info</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── SECTION 3: Items ── */}
      <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>
          Order Items ({order.items?.length ?? 0})
        </Typography>
        <OrderItemsTable items={order.items ?? []} />
      </Paper>

      {/* ── SECTION 4: Summary + Timeline ── */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>Timeline</Typography>
            <OrderTimeline
              placedAt={order.placedAt}
              deliveredAt={order.deliveredAt}
              cancelledAt={order.cancelledAt}
              order_status={order.order_status}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>Payment Summary</Typography>
            <OrderSummaryCard
              subtotal={order.subtotal_amount}
              discount={order.discount_amount}
              shipping={order.shipping_amount}
              tax={order.tax_amount}
              total={order.total_amount}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* ── Cancellation reason (if cancelled) ── */}
      {order.order_status === 'cancelled' && order.cancellation_reason && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>Cancellation Reason</Typography>
          <Typography variant="body2">{order.cancellation_reason}</Typography>
          {order.cancelledAt && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>· {formatDateTime(order.cancelledAt)}</Typography>
          )}
        </Alert>
      )}

      {/* ── SECTION 5: Admin Actions + Notes ── */}
      {(canUpdate || canCancel) && (
        <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332', mb: 2 }}>Admin Actions</Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
            {canUpdate && (
              <Button
                variant="contained" startIcon={<Edit />}
                onClick={() => setOpenUpdate(true)}
                sx={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
              >
                Update Status
              </Button>
            )}
            {canCancel && cancellable && (
              <Button
                variant="outlined" startIcon={<Cancel />}
                onClick={() => setOpenCancel(true)}
                sx={{ color: '#B91C1C', borderColor: '#B91C1C', '&:hover': { bgcolor: '#FEE2E2' } }}
              >
                Cancel Order
              </Button>
            )}
            <Button
              variant="outlined" size="small" startIcon={<OpenInNew />}
              onClick={handleViewInvoice}
              sx={{ borderColor: '#7C3AED', color: '#7C3AED', '&:hover': { bgcolor: '#F5F3FF' } }}
            >
              View Invoice
            </Button>
            <Button
              variant="outlined" size="small"
              startIcon={downloading ? <CircularProgress size={14} /> : <PictureAsPdf />}
              onClick={handleDownloadInvoice}
              disabled={downloading}
              sx={{ borderColor: '#0369A1', color: '#0369A1', '&:hover': { bgcolor: '#F0F9FF' } }}
            >
              Download PDF
            </Button>
          </Box>

          {canUpdate && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                Admin Notes
              </Typography>
              <Textarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes (not visible to customer)"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small" variant="outlined" onClick={handleNotesSave} disabled={savingNotes}
                  sx={{ borderColor: '#1B4332', color: '#1B4332' }}
                >
                  {savingNotes ? <CircularProgress size={16} /> : 'Save Notes'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Modals ── */}
      <UpdateStatusModal
        open={openUpdate}
        order={order}
        onClose={() => setOpenUpdate(false)}
        onUpdated={(updated) => { onOrderUpdate(updated); setOpenUpdate(false); }}
      />
      <CancelOrderModal
        open={openCancel}
        order={order}
        onClose={() => setOpenCancel(false)}
        onCancelled={(id, updated) => {
          onOrderUpdate(updated ?? { ...order, order_status: 'cancelled' });
          setOpenCancel(false);
        }}
      />
    </Box>
  );
}
