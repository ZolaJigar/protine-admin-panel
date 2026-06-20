'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Tooltip, Pagination,
  Divider,
} from '@mui/material';
import { Search, Visibility, Close, FilterList } from '@mui/icons-material';
import { toast } from 'react-toastify';

const initialOrders = [
  { id: '#ORD-1092', customer: 'Rahul Sharma',  email: 'rahul@example.com',  product: 'Classic Ketchup',     amount: 599,  status: 'Delivered',  date: '21 Jun 2026', address: '12 MG Road, Mumbai' },
  { id: '#ORD-1091', customer: 'Priya Mehta',   email: 'priya@example.com',   product: 'Garlic Mayonnaise',   amount: 399,  status: 'Pending',    date: '21 Jun 2026', address: '45 Park Street, Delhi' },
  { id: '#ORD-1090', customer: 'Amit Kumar',    email: 'amit@example.com',    product: 'Smoky BBQ Sauce',     amount: 299,  status: 'Shipped',    date: '20 Jun 2026', address: '8 Ring Road, Bangalore' },
  { id: '#ORD-1089', customer: 'Sneha Patel',   email: 'sneha@example.com',   product: 'Honey Mustard',       amount: 449,  status: 'Processing', date: '20 Jun 2026', address: '22 Civil Lines, Ahmedabad' },
  { id: '#ORD-1088', customer: 'Ravi Verma',    email: 'ravi@example.com',    product: 'Spicy Chilli Sauce',  amount: 249,  status: 'Cancelled',  date: '19 Jun 2026', address: '7 Sector 21, Chandigarh' },
  { id: '#ORD-1087', customer: 'Divya Singh',   email: 'divya@example.com',   product: 'Schezwan Sauce',      amount: 279,  status: 'Delivered',  date: '19 Jun 2026', address: '3 Mall Road, Pune' },
  { id: '#ORD-1086', customer: 'Kiran Joshi',   email: 'kiran@example.com',   product: 'Mint Chutney',        amount: 199,  status: 'Delivered',  date: '18 Jun 2026', address: '90 Anna Nagar, Chennai' },
  { id: '#ORD-1085', customer: 'Arjun Nair',    email: 'arjun@example.com',   product: 'Italian Herb Dressing',amount: 379, status: 'Shipped',    date: '18 Jun 2026', address: '15 Koramangala, Bangalore' },
];

const ALL_STATUSES = ['Delivered', 'Pending', 'Shipped', 'Processing', 'Cancelled'];

const statusColors = {
  Delivered:  { bgcolor: '#D8F3DC', color: '#1B4332' },
  Pending:    { bgcolor: '#FEF3C7', color: '#92400E' },
  Shipped:    { bgcolor: '#E0F2FE', color: '#0369A1' },
  Processing: { bgcolor: '#EDE9FE', color: '#7C3AED' },
  Cancelled:  { bgcolor: '#FEE2E2', color: '#B91C1C' },
};

const PER_PAGE = 8;

export default function AdminOrdersPage() {
  const [orders, setOrders]       = useState(initialOrders);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewOrder, setViewOrder] = useState(null);
  const [page, setPage]           = useState(1);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );
    if (viewOrder?.id === orderId) setViewOrder((prev) => ({ ...prev, status: newStatus }));
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  return (
    <AdminShell>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by order ID or customer..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 340 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
            htmlInput: { 'aria-label': 'Search orders' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{order.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{order.customer}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{order.product}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{order.amount}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{order.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        sx={{ ...statusColors[order.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setViewOrder(order)} sx={{ color: '#1B4332' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        {filtered.length > PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filtered.length / PER_PAGE)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Order Details — {viewOrder?.id}
          <IconButton onClick={() => setViewOrder(null)} size="small" aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        {viewOrder && (
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Customer',  value: viewOrder.customer },
                { label: 'Email',     value: viewOrder.email },
                { label: 'Product',   value: viewOrder.product },
                { label: 'Amount',    value: `₹${viewOrder.amount}` },
                { label: 'Date',      value: viewOrder.date },
                { label: 'Address',   value: viewOrder.address },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 90, color: '#1B4332' }}>{label}:</Typography>
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B4332', minWidth: 90 }}>Status:</Typography>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={viewOrder.status}
                    onChange={(e) => handleStatusChange(viewOrder.id, e.target.value)}
                  >
                    {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setViewOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminShell>
  );
}

