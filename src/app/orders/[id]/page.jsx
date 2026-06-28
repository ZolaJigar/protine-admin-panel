'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Box, Typography, Button, CircularProgress, Chip, Tooltip,
} from '@mui/material';
import { ArrowBack, OpenInNew, PictureAsPdf } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { usePermissions } from '@/hooks/usePermissions';
import { ordersAPI } from '@/lib/api';
import OrderDetailView from '@/components/orders/OrderDetailView';

export default function OrderDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { can }  = usePermissions();

  const canUpdate = can('order_update');
  const canCancel = can('order_cancel');
  const canView   = can('order_view');

  const [order,        setOrder]        = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  const [downloading,  setDownloading]  = useState(false);

  const loadOrder = () => {
    setIsLoading(true);
    setError('');
    ordersAPI.getById(id)
      .then((res) => setOrder(res?.data ?? res))
      .catch((err) => {
        const msg = typeof err === 'string' ? err : 'Failed to load order.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  const handleViewInvoice = () => {
    window.open(ordersAPI.invoiceViewUrl(id), '_blank', 'noopener,noreferrer');
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await ordersAPI.invoiceDownload(id);
    } catch {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (id) loadOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AdminShell requiredPermission="order_view">

      {/* ── Header bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined" startIcon={<ArrowBack />}
            onClick={() => router.push('/orders')}
            sx={{ borderColor: '#1B4332', color: '#1B4332' }}
            size="small"
          >
            Back
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>
            Order Detail
          </Typography>
          {order && (
            <Chip
              label={order.order_number}
              size="small"
              sx={{ bgcolor: '#D8F3DC', color: '#1B4332', fontWeight: 700, fontFamily: 'monospace' }}
            />
          )}
        </Box>

        {/* Invoice actions — shown once order is loaded */}
        {order && canView && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Invoice in new tab">
              <Button
                variant="outlined" size="small" startIcon={<OpenInNew />}
                onClick={handleViewInvoice}
                sx={{ borderColor: '#7C3AED', color: '#7C3AED', '&:hover': { bgcolor: '#F5F3FF' } }}
              >
                View Invoice
              </Button>
            </Tooltip>
            <Tooltip title="Download PDF">
              <Button
                variant="outlined" size="small" startIcon={downloading ? <CircularProgress size={14} /> : <PictureAsPdf />}
                onClick={handleDownloadInvoice}
                disabled={downloading}
                sx={{ borderColor: '#0369A1', color: '#0369A1', '&:hover': { bgcolor: '#F0F9FF' } }}
              >
                Download PDF
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ── Content ── */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#1B4332' }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Button variant="outlined" onClick={loadOrder} sx={{ borderColor: '#1B4332', color: '#1B4332' }}>
            Retry
          </Button>
        </Box>
      ) : order ? (
        <OrderDetailView
          order={order}
          onOrderUpdate={(updated) => setOrder((prev) => ({ ...prev, ...updated }))}
          canUpdate={canUpdate}
          canCancel={canCancel}
        />
      ) : null}
    </AdminShell>
  );
}
