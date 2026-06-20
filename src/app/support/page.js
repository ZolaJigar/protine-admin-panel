'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Pagination,
  Divider, Avatar,
} from '@mui/material';
import { Search, Visibility, Close, Send, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-toastify';

const initialTickets = [
  { id: '#TKT-201', customer: 'Rahul Sharma',  subject: 'Order not delivered',         status: 'Open',     priority: 'High',   date: '21 Jun 2026', replies: [] },
  { id: '#TKT-200', customer: 'Priya Mehta',   subject: 'Wrong product received',       status: 'Open',     priority: 'Medium', date: '20 Jun 2026', replies: [] },
  { id: '#TKT-199', customer: 'Amit Kumar',    subject: 'Request for refund',           status: 'Resolved', priority: 'High',   date: '19 Jun 2026', replies: ['We have processed your refund.'] },
  { id: '#TKT-198', customer: 'Sneha Patel',   subject: 'Product quality issue',        status: 'Pending',  priority: 'Low',    date: '18 Jun 2026', replies: [] },
  { id: '#TKT-197', customer: 'Kiran Joshi',   subject: 'Payment not confirmed',        status: 'Open',     priority: 'High',   date: '17 Jun 2026', replies: [] },
  { id: '#TKT-196', customer: 'Arjun Nair',    subject: 'Unable to apply promo code',   status: 'Resolved', priority: 'Low',    date: '16 Jun 2026', replies: ['Promo code updated.'] },
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
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewTicket, setViewTicket]     = useState(null);
  const [replyText, setReplyText]       = useState('');
  const [page, setPage]                 = useState(1);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.id.includes(search) || t.customer.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleReply = () => {
    if (!replyText.trim()) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === viewTicket.id ? { ...t, replies: [...t.replies, replyText.trim()], status: 'Pending' } : t
      )
    );
    setViewTicket((prev) => ({ ...prev, replies: [...prev.replies, replyText.trim()], status: 'Pending' }));
    setReplyText('');
    toast.success('Reply sent!');
  };

  const handleClose = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) => t.id === ticketId ? { ...t, status: 'Resolved' } : t)
    );
    if (viewTicket?.id === ticketId) setViewTicket((prev) => ({ ...prev, status: 'Resolved' }));
    toast.success('Ticket marked as resolved.');
  };

  return (
    <AdminShell>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search tickets..."
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
            htmlInput: { 'aria-label': 'Search tickets' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No tickets found.</TableCell>
                </TableRow>
              ) : (
                paginated.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{ticket.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{ticket.customer}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{ticket.subject}</TableCell>
                    <TableCell>
                      <Chip label={ticket.priority} size="small" sx={{ ...priorityColors[ticket.priority], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{ticket.date}</TableCell>
                    <TableCell>
                      <Chip label={ticket.status} size="small" sx={{ ...statusColors[ticket.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View & Reply">
                          <IconButton size="small" onClick={() => setViewTicket(ticket)} sx={{ color: '#1B4332' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {ticket.status !== 'Resolved' && (
                          <Tooltip title="Mark as Resolved">
                            <IconButton size="small" onClick={() => handleClose(ticket.id)} sx={{ color: '#40916C' }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
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

      {/* View/Reply Dialog */}
      <Dialog open={!!viewTicket} onClose={() => setViewTicket(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {viewTicket?.id} — {viewTicket?.subject}
          <IconButton onClick={() => setViewTicket(null)} size="small" aria-label="Close"><Close /></IconButton>
        </DialogTitle>
        {viewTicket && (
          <DialogContent>
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
                <TextField
                  fullWidth
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
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {viewTicket?.status !== 'Resolved' && (
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => { handleClose(viewTicket.id); setViewTicket(null); }}
              sx={{ color: '#1B4332', borderColor: '#1B4332' }}
            >
              Mark Resolved
            </Button>
          )}
          <Button variant="outlined" onClick={() => setViewTicket(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminShell>
  );
}

