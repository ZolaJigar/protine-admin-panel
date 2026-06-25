'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Table } from '@/components/ui';
import {
  Box, InputAdornment, IconButton, Tooltip, Chip, Pagination,
} from '@mui/material';
import { Search, Download } from '@mui/icons-material';
import { toast } from 'react-toastify';

const invoices = [
  { id: '#INV-1092', order: '#ORD-1092', customer: 'Rahul Sharma',  amount: 599,  date: '21 Jun 2026', status: 'Paid'     },
  { id: '#INV-1091', order: '#ORD-1091', customer: 'Priya Mehta',   amount: 399,  date: '21 Jun 2026', status: 'Pending'  },
  { id: '#INV-1090', order: '#ORD-1090', customer: 'Amit Kumar',    amount: 299,  date: '20 Jun 2026', status: 'Paid'     },
  { id: '#INV-1089', order: '#ORD-1089', customer: 'Sneha Patel',   amount: 449,  date: '20 Jun 2026', status: 'Paid'     },
  { id: '#INV-1088', order: '#ORD-1088', customer: 'Ravi Verma',    amount: 249,  date: '19 Jun 2026', status: 'Refunded' },
  { id: '#INV-1087', order: '#ORD-1087', customer: 'Divya Singh',   amount: 279,  date: '19 Jun 2026', status: 'Paid'     },
  { id: '#INV-1086', order: '#ORD-1086', customer: 'Kiran Joshi',   amount: 199,  date: '18 Jun 2026', status: 'Paid'     },
  { id: '#INV-1085', order: '#ORD-1085', customer: 'Arjun Nair',    amount: 379,  date: '18 Jun 2026', status: 'Paid'     },
];

const statusColors = {
  Paid:     { bgcolor: '#D8F3DC', color: '#1B4332' },
  Pending:  { bgcolor: '#FEF3C7', color: '#92400E' },
  Refunded: { bgcolor: '#FEE2E2', color: '#B91C1C' },
};

const PER_PAGE = 8;

export default function AdminInvoicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const filtered  = invoices.filter((i) =>
    i.id.includes(search) || i.customer.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDownload = (inv) => {
    toast.info(`📄 Downloading ${inv.id}...`);
  };

  const columns = [
    { key: 'id',       label: 'Invoice ID', render: (row) => <Box sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{row.id}</Box> },
    { key: 'order',    label: 'Order ID',   render: (row) => <Box sx={{ color: '#0369A1', fontWeight: 600, fontSize: 13 }}>{row.order}</Box> },
    { key: 'customer', label: 'Customer',   render: (row) => <Box sx={{ fontSize: 13 }}>{row.customer}</Box> },
    { key: 'amount',   label: 'Amount',     render: (row) => <Box sx={{ fontWeight: 700 }}>₹{row.amount}</Box> },
    { key: 'date',     label: 'Date',       render: (row) => <Box sx={{ fontSize: 13, color: 'text.secondary' }}>{row.date}</Box> },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <Chip label={row.status} size="small"
          sx={{ ...statusColors[row.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />
      ),
    },
    {
      key: 'actions', label: 'Actions', align: 'center',
      render: (row) => (
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => handleDownload(row)} sx={{ color: '#1B4332' }}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="invoice_list">
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextInput
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 340 }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> },
            htmlInput: { 'aria-label': 'Search invoices' },
          }}
        />
      </Box>

      <Table
        columns={columns}
        rows={paginated}
        loading={false}
        emptyMessage="No invoices found."
        showPagination={false}
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
