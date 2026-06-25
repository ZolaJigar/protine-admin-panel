'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table } from '@/components/ui';
import { Box, InputAdornment, Chip, Pagination } from '@mui/material';
import { Search } from '@mui/icons-material';

const deliveries = [
  { id: '#ORD-1092', customer: 'Rahul Sharma',  address: '12 MG Road, Mumbai',        courier: 'BlueDart',  trackingNo: 'BD123456', status: 'Delivered',  eta: '21 Jun 2026' },
  { id: '#ORD-1090', customer: 'Amit Kumar',    address: '8 Ring Road, Bangalore',    courier: 'DTDC',      trackingNo: 'DT789012', status: 'In Transit', eta: '23 Jun 2026' },
  { id: '#ORD-1089', customer: 'Sneha Patel',   address: '22 Civil Lines, Ahmedabad', courier: 'Delhivery', trackingNo: 'DL345678', status: 'Dispatched', eta: '24 Jun 2026' },
  { id: '#ORD-1087', customer: 'Divya Singh',   address: '3 Mall Road, Pune',         courier: 'BlueDart',  trackingNo: 'BD901234', status: 'Delivered',  eta: '20 Jun 2026' },
  { id: '#ORD-1086', customer: 'Kiran Joshi',   address: '90 Anna Nagar, Chennai',    courier: 'DTDC',      trackingNo: 'DT567890', status: 'Delivered',  eta: '18 Jun 2026' },
  { id: '#ORD-1085', customer: 'Arjun Nair',    address: '15 Koramangala, Bangalore', courier: 'Delhivery', trackingNo: 'DL123456', status: 'In Transit', eta: '25 Jun 2026' },
  { id: '#ORD-1091', customer: 'Priya Mehta',   address: '45 Park Street, Delhi',     courier: '—',         trackingNo: '—',        status: 'Pending',    eta: '—'           },
];

const statusColors = {
  Delivered:    { bgcolor: '#D8F3DC', color: '#1B4332' },
  'In Transit': { bgcolor: '#E0F2FE', color: '#0369A1' },
  Dispatched:   { bgcolor: '#EDE9FE', color: '#7C3AED' },
  Pending:      { bgcolor: '#FEF3C7', color: '#92400E' },
};

const PER_PAGE = 8;

export default function AdminDeliveryPage() {
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]                 = useState(1);

  const filtered = deliveries.filter((d) => {
    const matchSearch = d.id.includes(search) || d.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || filterStatus === 'All' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const columns = [
    { key: 'id',         label: 'Order ID',    render: (row) => <Box sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{row.id}</Box> },
    { key: 'customer',   label: 'Customer',    render: (row) => <Box sx={{ fontWeight: 600, fontSize: 13 }}>{row.customer}</Box> },
    { key: 'address',    label: 'Address',     render: (row) => <Box sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 180 }}>{row.address}</Box> },
    { key: 'courier',    label: 'Courier',     render: (row) => <Box sx={{ fontSize: 13 }}>{row.courier}</Box> },
    { key: 'trackingNo', label: 'Tracking No', render: (row) => <Box sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.trackingNo}</Box> },
    { key: 'eta',        label: 'ETA',         render: (row) => <Box sx={{ fontSize: 13 }}>{row.eta}</Box> },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <Chip label={row.status} size="small"
          sx={{ ...statusColors[row.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="delivery_list">
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput
          placeholder="Search by order or customer..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 340 }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> },
            htmlInput: { 'aria-label': 'Search deliveries' },
          }}
        />
        <Select
          label="Status"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          options={[
            { label: 'All',        value: '' },
            { label: 'Pending',    value: 'Pending' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered',  value: 'Delivered' },
          ]}
          size="small"
          sx={{ minWidth: 160 }}
        />
      </Box>

      <Table
        columns={columns}
        rows={paginated}
        loading={false}
        emptyMessage="No deliveries found."
        showPagination={false}
        minWidth={700}
      />

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
    </AdminShell>
  );
}
