'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { TextInput, Select, Table, Modal } from '@/components/ui';
import {
  Box, Typography, Button, InputAdornment,
  IconButton,
  Tooltip, Chip, Pagination, Divider, Avatar,
} from '@mui/material';
import { Search, Visibility, Send, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-toastify';

const initialTickets = [
  { id: '#TKT-201', customer: 'Rahul Sharma',  subject: 'Order not delivered',       status: 'Open',     priority: 'High',   date: '21 Jun 2026', replies: [] },
  { id: '#TKT-200', customer: 'Priya Mehta',   subject: 'Wrong product received',     status: 'Open',     priority: 'Medium', date: '20 Jun 2026', replies: [] },
  { id: '#TKT-199', customer: 'Amit Kumar',    subject: 'Request for refund',         status: 'Resolved', priority: 'High',   date: '19 Jun 2026', replies: ['We have processed your refund.'] },
  { id: '#TKT-198', customer: 'Sneha Patel',   subject: 'Product quality issue',      status: 'Pending',  priority: 'Low',    date: '18 Jun 2026', replies: [] },
  { id: '#TKT-197', customer: 'Kiran Joshi',   subject: 'Payment not confirmed',      status: 'Open',     priority: 'High',   date: '17 Jun 2026', replies: [] },
  { id: '#TKT-196', customer: 'Arjun Nair',    subject: 'Unable to apply promo code', status: 'Resolved', priority: 'Low',    date: '16 Jun 2026', replies: ['Promo code updated.'] },
];

const statusColors = {
  Open:     { bgcolor: '#FEF3C7', color: '#92400E' },
  Pending:  { bgcolor: '#E0F2FE', color: '#0369A1' },
  Resolved: { bgcolor: '#D8F3DC', color: '#1B4332' },
};
const priorityColors = {
  High:   { bgcolor: '#FEE2E2', color: '#B91C1C' },
  Medium: { bgcolor: '#FEF3C7', color: '#92400E' },
  Low:    { bgcolor: '#D8F3DC', color: '#1B4332' },
};

const PER_PAGE = 8;

export default function AdminSupportPage() {
  const [tickets, setTickets]           = useState(initialTickets);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewTicket, setViewTicket]     = useState(null);
  const [replyText, setReplyText]       = useState('');
  const [page, setPage]                 = useState(1);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.id.includes(search) || t.customer.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || filterStatus === 'All' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleReply = () => {
    if (!replyText.trim()) return;
    setTickets((prev) =>
      prev.map((t) => t.id === viewTicket.id ? { ...t, replies: [...t.replies, replyText.trim()], status: 'Pending' } : t)
    );
    setViewTicket((prev) => ({ ...prev, replies: [...prev.replies, replyText.trim()], status: 'Pending' }));
    setReplyText('');
    toast.success('Reply sent!');
  };

  const handleClose = (ticketId) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'Resolved' } : t));
    if (viewTicket?.id === ticketId) setViewTicket((prev) => ({ ...prev, status: 'Resolved' }));
    toast.success('Ticket marked as resolved.');
  };

  const columns = [
    { key: 'id',       label: 'Ticket ID', render: (row) => <Box sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{row.id}</Box> },
    { key: 'customer', label: 'Customer',  render: (row) => <Box sx={{ fontWeight: 600, fontSize: 13 }}>{row.customer}</Box> },
    { key: 'subject',  label: 'Subject',   render: (row) => <Box sx={{ fontSize: 13 }}>{row.subject}</Box> },
    {
      key: 'priority', label: 'Priority',
      render: (row) => <Chip label={row.priority} size="small" sx={{ ...priorityColors[row.priority], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />,
    },
    { key: 'date', label: 'Date', render: (row) => <Box sx={{ fontSize: 13, color: 'text.secondary' }}>{row.date}</Box> },
    {
      key: 'status', label: 'Status',
      render: (row) => <Chip label={row.status} size="small" sx={{ ...statusColors[row.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />,
    },
    {
      key: 'actions', label: 'Actions', align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View & Reply">
            <IconButton size="small" onClick={() => setViewTicket(row)} sx={{ color: '#1B4332' }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status !== 'Resolved' && (
            <Tooltip title="Mark as Resolved">
              <IconButton size="small" onClick={() => handleClose(row.id)} sx={{ color: '#40916C' }}>
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <AdminShell requiredPermission="support_list">
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 340 }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> },
            htmlInput: { 'aria-label': 'Search tickets' },
          }}
        />
        <Select
          label="Status"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          options={[
            { label: 'All',      value: '' },
            { label: 'Open',     value: 'Open' },
            { label: 'Pending',  value: 'Pending' },
            { label: 'Resolved', value: 'Resolved' },
          ]}
          size="small"
          sx={{ minWidth: 160 }}
        />
      </Box>

      <Table
        columns={columns}
        rows={paginated}
        loading={false}
        emptyMessage="No tickets found."
        showPagination={false}
        minWidth={700}
      />

      {filtered.length > PER_PAGE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* View / Reply Modal */}
      <Modal open={!!viewTicket} onClose={() => setViewTicket(null)}
        title={viewTicket ? `${viewTicket.id} — ${viewTicket.subject}` : ''}
        maxWidth="sm"
        actions={<>
          {viewTicket?.status !== 'Resolved' && (
            <Button variant="outlined" startIcon={<CheckCircle />}
              onClick={() => { handleClose(viewTicket.id); setViewTicket(null); }}
              sx={{ color: '#1B4332', borderColor: '#1B4332' }}>
              Mark Resolved
            </Button>
          )}
          <Button variant="outlined" onClick={() => setViewTicket(null)}>Close</Button>
        </>}
      >
        {viewTicket && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2"><strong>Customer:</strong> {viewTicket.customer}</Typography>
              <Chip label={viewTicket.status} size="small" sx={{ ...statusColors[viewTicket.status], fontWeight: 700 }} />
            </Box>
            <Divider sx={{ mb: 2 }} />

            {viewTicket.replies.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>No replies yet.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                {viewTicket.replies.map((r, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 12, fontWeight: 800 }}>A</Avatar>
                    <Box sx={{ bgcolor: '#F5F0E8', borderRadius: 2, px: 2, py: 1.25, flex: 1 }}>
                      <Typography variant="body2">{r}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {viewTicket.status !== 'Resolved' && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextInput
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  size="small"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                />
                <Button variant="contained" endIcon={<Send />} onClick={handleReply} sx={{ whiteSpace: 'nowrap' }}>
                  Send
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Modal>
    </AdminShell>
  );
}
