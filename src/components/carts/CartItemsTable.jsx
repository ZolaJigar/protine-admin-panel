'use client';

import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton, Tooltip, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
} from '@mui/material';
import { Remove, Add, Close } from '@mui/icons-material';
import { formatAmount } from '@/utils/cartUtils';

/**
 * RemoveItemConfirm — inline confirm dialog for single-item removal.
 */
function RemoveItemConfirm({ open, item, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1.5 }}>
        Remove Item
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Remove <strong>{item?.variant?.name ?? 'this item'}</strong> from cart?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained" onClick={onConfirm} disabled={loading}
          sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' }, minWidth: 100 }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * CartItemsTable — displays cart items with inline quantity controls and remove button.
 * Props:
 *   items             Array<cart_item>
 *   onQuantityChange  (cartItemId, newQty) => void
 *   onRemoveItem      (cartItemId, onDone) => void
 *   cartStatus        string  — 'active'|'converted'|'abandoned' — only active allows edits
 */
export default function CartItemsTable({
  items = [],
  onQuantityChange,
  onRemoveItem,
  cartStatus = 'active',
}) {
  const [removeTarget,  setRemoveTarget]  = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const editable = cartStatus === 'active';

  const handleConfirmRemove = () => {
    setRemoveLoading(true);
    onRemoveItem(removeTarget.id, () => {
      setRemoveLoading(false);
      setRemoveTarget(null);
    });
  };

  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No items in this cart.
      </Typography>
    );
  }

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FBF8' }}>
                {[
                  { label: 'Product', align: 'left' },
                  { label: 'Variant / SKU', align: 'left' },
                  { label: 'Unit Price', align: 'right' },
                  { label: 'Qty', align: 'center' },
                  { label: 'Total', align: 'right' },
                  ...(editable ? [{ label: '', align: 'center' }] : []),
                ].map(({ label, align }) => (
                  <TableCell
                    key={label}
                    align={align}
                    sx={{ fontWeight: 700, fontSize: 12, color: '#57534E', py: 1.25, borderBottom: '1px solid #E7E5E4' }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const variantImage = item.variant?.image;
                const qty = item.quantity;

                return (
                  <TableRow key={item.id} hover>
                    {/* Product */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {variantImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={variantImage}
                            alt={item.variant?.name ?? ''}
                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #E7E5E4' }}
                          />
                        ) : (
                          <Avatar
                            variant="rounded"
                            sx={{ width: 44, height: 44, bgcolor: '#D8F3DC', color: '#1B4332', fontSize: 16, fontWeight: 800 }}
                          >
                            {(item.product?.name ?? '?')[0]}
                          </Avatar>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }} noWrap>
                            {item.product?.name ?? '—'}
                          </Typography>
                          {item.product?.slug && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {item.product.slug}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Variant / SKU */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
                          {item.variant?.name ?? '—'}
                        </Typography>
                        {item.variant?.sku && (
                          <Chip
                            label={item.variant.sku}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: 10, height: 18, mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Unit Price */}
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {formatAmount(item.unit_price)}
                      </Typography>
                      {item.variant?.mrp && parseFloat(item.variant.mrp) > parseFloat(item.unit_price) && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', textDecoration: 'line-through', display: 'block' }}>
                          {formatAmount(item.variant.mrp)}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Qty controls */}
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      {editable ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Decrease">
                            <span>
                              <IconButton
                                size="small"
                                disabled={qty <= 1}
                                onClick={() => onQuantityChange(item.id, qty - 1)}
                                sx={{
                                  width: 26, height: 26,
                                  border: '1px solid #E7E5E4', borderRadius: 1,
                                  color: qty <= 1 ? '#C4BAB4' : '#1B4332',
                                }}
                              >
                                <Remove sx={{ fontSize: 14 }} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, minWidth: 28, textAlign: 'center', fontSize: 14 }}
                          >
                            {qty}
                          </Typography>

                          <Tooltip title="Increase">
                            <IconButton
                              size="small"
                              onClick={() => onQuantityChange(item.id, qty + 1)}
                              sx={{
                                width: 26, height: 26,
                                border: '1px solid #E7E5E4', borderRadius: 1,
                                color: '#1B4332',
                              }}
                            >
                              <Add sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>{qty}</Typography>
                      )}
                    </TableCell>

                    {/* Total price */}
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                        {formatAmount(item.total_price)}
                      </Typography>
                    </TableCell>

                    {/* Remove */}
                    {editable && (
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Tooltip title="Remove item">
                          <IconButton
                            size="small"
                            onClick={() => setRemoveTarget(item)}
                            sx={{
                              color: '#B91C1C',
                              '&:hover': { bgcolor: '#FEE2E2' },
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Remove confirm dialog */}
      <RemoveItemConfirm
        open={!!removeTarget}
        item={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        loading={removeLoading}
      />
    </>
  );
}
