'use client';

import {
  AppBar, Toolbar, IconButton, Typography, Box, Badge,
  Avatar, Menu, MenuItem, Divider, Tooltip,
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Settings, Logout, NavigateNext } from '@mui/icons-material';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAdmin } from '@/context/AdminContext';

// Map path segments to human-readable labels
const SEGMENT_LABELS = {
  '':                  'Home',
  'products':          'Products',
  'categories':        'Categories',
  'orders':            'Orders',
  'carts':             'Carts',
  'users':             'Users',
  'logs':              'Login Logs',
  'roles':             'Roles',
  'countries':         'Countries',
  'states':            'States',
  'cities':            'Cities',
  'banners':           'Banners',
  'wishlist':          'Wishlist',
  'contact-us':        'Contact Us',
  'themes':            'Themes',
  'addresses':         'Addresses',
  'product-variants':  'Product Variants',
  'analytics':         'Analytics',
  'settings':          'Settings',
  'add':               'Add',
  'edit':              'Edit',
  'view':              'View',
};

// Segments that live under the "Masters" virtual group
const MASTERS_SEGMENTS = new Set(['countries', 'states', 'cities', 'banners', 'wishlist', 'contact-us', 'themes', 'addresses']);

function buildBreadcrumbs(pathname) {
  // Always start with non-clickable Home
  const crumbs = [{ label: 'Home', href: null }];

  if (pathname === '/') return crumbs;

  const segments = pathname.split('/').filter(Boolean);
  let path = '';

  segments.forEach((seg) => {
    path += '/' + seg;
    const isDynamic = /^\d+$/.test(seg) || (seg.startsWith('[') && seg.endsWith(']'));
    if (isDynamic) return;

    // Inject non-clickable "Masters" before country/state/city
    if (MASTERS_SEGMENTS.has(seg) && !crumbs.some((c) => c.label === 'Masters')) {
      crumbs.push({ label: 'Masters', href: null });
    }

    crumbs.push({
      label: SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      href: path,
    });
  });

  return crumbs;
}

export default function AdminTopbar({ sidebarWidth }) {
  const pathname = usePathname();
  const { state, dispatch, logout } = useAdmin();
  const [anchorEl, setAnchorEl] = useState(null);

  const crumbs = buildBreadcrumbs(pathname);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    toast.success('👋 Logged out successfully');
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
        {/* Sidebar toggle */}
        <IconButton onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} sx={{ color: '#1B4332' }} aria-label="Toggle sidebar">
          <MenuIcon />
        </IconButton>

        {/* Breadcrumbs */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <Box key={`${crumb.label}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                {idx > 0 && (
                  <NavigateNext sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
                )}
                {isLast ? (
                  // Last crumb — bold, non-clickable
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: '#1B4332', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {crumb.label}
                  </Typography>
                ) : crumb.href ? (
                  // Middle crumb with a real href — clickable
                  <Typography
                    component={Link}
                    href={crumb.href}
                    variant="body2"
                    sx={{ color: 'text.secondary', textDecoration: 'none', whiteSpace: 'nowrap', '&:hover': { color: '#1B4332', textDecoration: 'underline' } }}
                  >
                    {crumb.label}
                  </Typography>
                ) : (
                  // No href — plain text, not clickable (Home, Masters)
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.disabled', whiteSpace: 'nowrap', cursor: 'default' }}
                  >
                    {crumb.label}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton sx={{ color: '#1C1917' }} aria-label="Notifications">
            <Badge badgeContent={3} sx={{ '& .MuiBadge-badge': { bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 700 } }}>
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Avatar / account menu */}
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
