'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Box, Paper, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Tooltip, Pagination,
  Avatar,
} from '@mui/material';
import { Search, Edit, Delete, Visibility, Close } from '@mui/icons-material';
import { toast } from 'react-toastify';

const initialUsers = [
  { id: 1,  name: 'Rahul Sharma',  email: 'rahul@example.com',  phone: '+91 98765 43210', role: 'customer', status: 'Active',   joined: '12 Jan 2025', orders: 14 },
  { id: 2,  name: 'Priya Mehta',   email: 'priya@example.com',  phone: '+91 87654 32109', role: 'customer', status: 'Active',   joined: '28 Feb 2025', orders: 7  },
  { id: 3,  name: 'Amit Kumar',    email: 'amit@example.com',   phone: '+91 76543 21098', role: 'customer', status: 'Inactive', joined: '5 Mar 2025',  orders: 3  },
  { id: 4,  name: 'Sneha Patel',   email: 'sneha@example.com',  phone: '+91 65432 10987', role: 'customer', status: 'Active',   joined: '19 Apr 2025', orders: 21 },
  { id: 5,  name: 'Ravi Verma',    email: 'ravi@example.com',   phone: '+91 54321 09876', role: 'customer', status: 'Banned',   joined: '1 May 2025',  orders: 0  },
  { id: 6,  name: 'Divya Singh',   email: 'divya@example.com',  phone: '+91 43210 98765', role: 'admin',    status: 'Active',   joined: '10 Jun 2025', orders: 0  },
  { id: 7,  name: 'Kiran Joshi',   email: 'kiran@example.com',  phone: '+91 32109 87654', role: 'customer', status: 'Active',   joined: '22 Jun 2025', orders: 9  },
  { id: 8,  name: 'Arjun Nair',    email: 'arjun@example.com',  phone: '+91 21098 76543', role: 'customer', status: 'Active',   joined: '4 Jul 2025',  orders: 5  },
];

const statusColors = {
  Active:   { bgcolor: '#D8F3DC', color: '#1B4332' },
  Inactive: { bgcolor: '#F5F5F5', color: '#57534E' },
  Banned:   { bgcolor: '#FEE2E2', color: '#B91C1C' },
};

const roleColors = {
  customer: { bgcolor: '#E0F2FE', color: '#0369A1' },
  admin:    { bgcolor: '#EDE9FE', color: '#7C3AED' },
};

const PER_PAGE = 8;

export default function AdminUsersPage() {
  const [users, setUsers]             = useState(initialUsers);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewUser, setViewUser]       = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [page, setPage]               = useState(1);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleStatusToggle = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const next = u.status === 'Active' ? 'Inactive' : 'Active';
        return { ...u, status: next };
      })
    );
    toast.success('User status updated.');
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    const target = deleteDialog;
    setDeleteDialog(null);
    setUsers((prev) => prev.filter((u) => u.id !== target.id));
    toast.success(`🗑️ User "${target.name}" deleted.`);
  };

  return (
    <AdminShell>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or email..."
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
            htmlInput: { 'aria-label': 'Search users' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Banned">Banned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 14, fontWeight: 800 }}>
                          {user.name[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{user.email}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{user.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{ ...roleColors[user.role], fontWeight: 700, borderRadius: 1.5, fontSize: 11, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{user.orders}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{user.joined}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        sx={{ ...statusColors[user.status], fontWeight: 700, borderRadius: 1.5, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => setViewUser(user)} sx={{ color: '#1B4332' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleStatusToggle(user.id)} sx={{ color: '#D97706' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteDialog(user)} sx={{ color: '#B91C1C' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onClose={() => setViewUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          User Details
          <IconButton onClick={() => setViewUser(null)} size="small" aria-label="Close"><Close /></IconButton>
        </DialogTitle>
        {viewUser && (
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: '#1B4332', color: '#F59E0B', fontSize: 26, fontWeight: 800, mb: 1 }}>
                {viewUser.name[0]}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{viewUser.name}</Typography>
              <Chip label={viewUser.role} size="small" sx={{ ...roleColors[viewUser.role], mt: 0.5, fontWeight: 700, textTransform: 'capitalize' }} />
            </Box>
            {[
              { label: 'Email',   value: viewUser.email },
              { label: 'Phone',   value: viewUser.phone },
              { label: 'Joined',  value: viewUser.joined },
              { label: 'Orders',  value: viewUser.orders },
              { label: 'Status',  value: viewUser.status },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 70, color: '#1B4332' }}>{label}:</Typography>
                <Typography variant="body2">{value}</Typography>
              </Box>
            ))}
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setViewUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#7F1D1D' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AdminShell>
  );
}

