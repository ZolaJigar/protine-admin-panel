'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Tooltip, Avatar,
} from '@mui/material';
import {
  Dashboard, Inventory, Category, ShoppingCart, People,
  Receipt, LocalShipping, Support, BarChart, Settings,
  Logout, Public, Map, LocationCity, AdminPanelSettings, Tune, ManageSearch,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAdmin } from '@/context/AdminContext';

const navItems = [
  { label: 'Dashboard',  href: '/',           icon: <Dashboard /> },
  { label: 'Products',   href: '/products',          icon: <Inventory /> },
  { label: 'Product Variants', href: '/product-variants', icon: <Tune /> },
  { label: 'Categories', href: '/categories',         icon: <Category /> },
  { label: 'Orders',     href: '/orders',     icon: <ShoppingCart /> },
  { label: 'Users',      href: '/users',      icon: <People /> },
  { label: 'Login Logs', href: '/logs',        icon: <ManageSearch /> },
  { label: 'Roles',      href: '/roles',      icon: <AdminPanelSettings /> },
  { label: 'Countries',  href: '/countries',  icon: <Public /> },
  { label: 'States',     href: '/states',     icon: <Map /> },
  { label: 'Cities',     href: '/cities',     icon: <LocationCity /> },
  { label: 'Invoices',   href: '/invoices',   icon: <Receipt /> },
  { label: 'Delivery',   href: '/delivery',   icon: <LocalShipping /> },
  { label: 'Support',    href: '/support',    icon: <Support /> },
  { label: 'Analytics',  href: '/analytics',  icon: <BarChart /> },
  { label: 'Settings',   href: '/settings',   icon: <Settings /> },
];

function NavItem({ item, open, active }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <Tooltip title={open ? '' : item.label} placement="right" arrow>
        <ListItemButton
          component={Link}
          href={item.href}
          sx={{
            borderRadius: 2, mx: 1,
            px: open ? 2 : 1.5, py: 1.25,
            justifyContent: open ? 'flex-start' : 'center',
            background: active ? 'linear-gradient(135deg, #1B4332, #2D6A4F)' : 'transparent',
            color: active ? '#FFF8F0' : 'rgba(255,248,240,0.65)',
            '&:hover': {
              background: active ? 'linear-gradient(135deg, #0D2B1F, #1B4332)' : 'rgba(255,248,240,0.08)',
              color: '#FFF8F0',
            },
            transition: 'all 0.2s',
          }}
        >
          <ListItemIcon sx={{ minWidth: open ? 36 : 'auto', color: active ? '#F59E0B' : 'inherit', justifyContent: 'center' }}>
            {item.icon}
          </ListItemIcon>
          {open && (
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { fontWeight: active ? 700 : 500, fontSize: 14 } }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
}

export default function AdminSidebar({ open, width, miniWidth }) {
  const pathname = usePathname();
  const { state, logout } = useAdmin();

  const handleLogout = () => {
    logout();
    toast.success('👋 Logged out successfully');
  };

  const content = (
    <Box sx={{ width: open ? width : miniWidth, minHeight: '100vh', background: '#0F172A', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', overflow: 'hidden' }}>
      {/* Brand */}
      <Box sx={{ px: open ? 2.5 : 1, py: 2.5, borderBottom: '2px solid #F59E0B', display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 76 }}>
        <Box sx={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon-192.png"
            alt="Protine Web"
            style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8 }}
          />
        </Box>
        {open && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#FFF8F0', lineHeight: 1.2 }}>Protine Web</Typography>
            <Typography sx={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, letterSpacing: 1 }}>ADMIN PANEL</Typography>
          </Box>
        )}
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, py: 1.5 }}>
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return <NavItem key={item.href} item={item} open={open} active={active} />;
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,248,240,0.08)' }} />

      {/* Admin info + logout */}
      <Box sx={{ p: open ? 2 : 1, pb: 3 }}>
        {open ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,248,240,0.06)', mb: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 800, fontSize: 14 }}>
              {state.admin?.name?.[0] || 'A'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#FFF8F0' }}>{state.admin?.name || 'Admin'}</Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,248,240,0.5)', textTransform: 'capitalize' }}>{state.admin?.role?.replace('_', ' ') || 'admin'}</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Tooltip title={state.admin?.name || 'Admin'} placement="right" arrow>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 800, fontSize: 14 }}>
                {state.admin?.name?.[0] || 'A'}
              </Avatar>
            </Tooltip>
          </Box>
        )}
        <Tooltip title={open ? '' : 'Logout'} placement="right" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: 2, px: open ? 2 : 1.5, py: 1, color: '#F87171', justifyContent: open ? 'flex-start' : 'center', '&:hover': { bgcolor: 'rgba(248,113,113,0.12)' } }}
          >
            <ListItemIcon sx={{ minWidth: open ? 36 : 'auto', color: 'inherit', justifyContent: 'center' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            {open && <ListItemText primary="Logout" slotProps={{ primary: { fontWeight: 600, fontSize: 14 } }} />}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: open ? width : miniWidth,
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          border: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
