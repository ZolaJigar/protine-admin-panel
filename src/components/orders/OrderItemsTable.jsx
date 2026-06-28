'use client';

import {
  Box, Typography, Chip, Paper,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { formatAmount } from '@/utils/orderUtils';

/**
 * OrderItemsTable — snapshot order items in a styled table.
 * Props: items Array<{ id, product_name, variant_name, sku, quantity, unit_price, line_total }>
 */
export default function OrderItemsTable({ items = [] }) {
  if (!items.length) {
    return <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No items found.</Typography>;
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FBF8' }}>
              {[
                { label: 'Product', align: 'left' },
                { label: 'Variant', align: 'left' },
                { label: 'SKU', align: 'left' },
                { label: 'Qty', align: 'right' },
                { label: 'Unit Price', align: 'right' },
                { label: 'Line Total', align: 'right' },
              ].map(({ label, align }) => (
                <TableCell key={label} align={align}
                  sx={{ fontWeight: 700, fontSize: 12, color: '#57534E', py: 1.25, borderBottom: '1px solid #E7E5E4' }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ py: 1.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{item.product_name || '—'}</Typography>
                </TableCell>
                <TableCell sx={{ py: 1.25 }}>
                  <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>{item.variant_name || '—'}</Typography>
                </TableCell>
                <TableCell sx={{ py: 1.25 }}>
                  {item.sku
                    ? <Chip label={item.sku} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10, height: 20 }} />
                    : <Typography variant="body2" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ py: 1.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{item.quantity}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 1.25 }}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{formatAmount(item.unit_price)}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 1.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{formatAmount(item.line_total)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
