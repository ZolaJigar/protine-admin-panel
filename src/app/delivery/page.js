'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Tooltip, Pagination, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Search, LocalShipping } from '@mui/icons-material';
import { toast } from 'react-toastify';

const deliveries = [
  { id: '#ORD-1092', customer: 'Rahul Sharma',  address: '12 MG Road, Mumbai',        courier: 'BlueDart',  trackingNo: 'BD123456', status: 'Delivered',   eta: '21 Jun 2026' },
  { id: '#ORD-1090', customer: 'Amit Kumar',    address: '8 Ring Road, Bangalore',    courier: 'DTDC',      trackingNo: 'DT789012', status: 'In Transit',  eta: '23 Jun 2026' },
  { id: '#ORD-1089', customer: 'Sneha Patel',   address: '22 Civil Lines, Ahmedabad', courier: 'Delhivery', trackingNo: 'DL345678', status: 'Dispatched',  eta: '24 Jun 2026' },
  { id: '#ORD-1087', customer: 'Divya Singh',   address: '3 Mall Road, Pune',         courier: 'BlueDart',  trackingNo: 'BD901234', status: 'Delivered',   eta: '20 Jun 2026' },
  { id: '#ORD-1086', customer: 'Kiran Joshi',   address: '90 Anna Nagar, Chennai',    courier: 'DTDC',      trackingNo: 'DT567890', status: 'Delivered',   eta: '18 Jun 2026' },
  { id: '#ORD-1085', customer: 'Arjun Nair',    address: '15 Koramangala, Bangalore', courier: 'Delhivery', trackingNo: 'DL123456', status: 'In Transit',  eta: '25 Jun 2026' },
  { id: '#ORD-1091', customer: 'Priya Mehta',   address: '45 Park Street, Delhi',     courier: '—',         trackingNo: '—',        status: 'Pending',     eta: '—'           },
];

const statusColors = {
  Delivered:   { bgcolor: '#D8F3DC', color: '#1B4332' },
  'In Transit':{ bgcolor: '#E0F2FE', color: '#0369A1' },
  Dispatched:  { bgcolor: '#EDE9FE', color: '#7C3AED' },
  Pending:     { bgcolor: '#FEF3C7', color: '#92400E' },
};

const PER_PAGE = 8;

export default function AdminDeliveryPage() {
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage]                 = useState(1);

  const filtered = deliveries.filter((d) => {
    const matchSearch = d.id.includes(search) || d.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminShell>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by order or customer..."
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
            htmlInput: { 'aria-label': 'Search deliveries' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Dispatched">Dispatched</MenuItem>
            <MenuItem value="In Transit">In Transit</MenuItem>
            <MenuItem value="Delivered">Delivered</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Courier</TableCell>
                <TableCell>Tracking No</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No deliveries found.</TableCell>
                </TableRow>
              ) : (
                paginated.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{d.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{d.customer}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 180 }}>{d.address}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.courier}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{d.trackingNo}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.eta}</TableCell>
                    <TableCell>
                      <Chip label={d.status} size="small" sx={{ ...statusColors[d.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        {filtered.length > PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Paper>
    </AdminShell>
  );
}

