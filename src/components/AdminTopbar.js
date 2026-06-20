'use client';

import {
  AppBar, Toolbar, IconButton, Typography, Box, Badge,
  Avatar, Menu, MenuItem, Divider, Tooltip,
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Settings, Logout } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAdmin } from '@/context/AdminContext';

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/products':   'Products',
  '/categories': 'Categories',
  '/orders':     'Orders',
  '/users':      'Users',
  '/invoices':   'Invoices',
  '/delivery':   'Delivery',
  '/support':    'Support',
  '/analytics':  'Analytics',
  '/settings':   'Settings',
};

export default function AdminTopbar({ sidebarWidth }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { state, dispatch } = useAdmin();
  const [anchorEl, setAnchorEl] = useState(null);

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    key === '/' ? pathname === '/' : pathname.startsWith(key)
  )?.[1] || 'Admin Panel';

  const handleLogout = () => {
    setAnchorEl(null);
    dispatch({ type: 'LOGOUT' });
    toast.success('👋 Logged out');
    router.push('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: { md: sidebarWidth },
        width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
        transition: 'left 0.3s ease, width 0.3s ease',
        background: '#FFFFFF',
        borderBottom: '1px solid #E7E5E4',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        color: '#1C1917',
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 64, md: 72 } }}>
        <IconButton onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} sx={{ color: '#1B4332' }} aria-label="Toggle sidebar">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332', flex: 1 }}>
          {pageTitle}
        </Typography>
        <Tooltip title="Notifications">
          <IconButton sx={{ color: '#1C1917' }} aria-label="Notifications">
            <Badge badgeContent={3} sx={{ '& .MuiBadge-badge': { bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 700 } }}>
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" aria-label="Admin account menu">
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#1B4332', color: '#F59E0B', fontWeight: 800, fontSize: 15 }}>
            {state.admin?.name?.[0] || 'A'}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #E7E5E4' } } }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #E7E5E4' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B4332' }}>{state.admin?.name || 'Admin'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{state.admin?.email || ''}</Typography>
          </Box>
          <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)} sx={{ py: 1.25, gap: 1.5, '&:hover': { bgcolor: '#D8F3DC' } }}>
            <Settings fontSize="small" sx={{ color: '#1B4332' }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1.25, gap: 1.5, color: '#B91C1C', '&:hover': { bgcolor: '#FEE2E2' } }}>
            <Logout fontSize="small" /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
