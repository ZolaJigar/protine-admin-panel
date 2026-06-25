'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Tooltip,
} from '@mui/material';
import {
  Dashboard, Inventory, Category, ShoppingCart, People,
  Receipt, LocalShipping, Support, BarChart, Settings,
  Public, Map, LocationCity, AdminPanelSettings, Tune, ManageSearch,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Nav items — each has an optional `permission` slug.
 * If omitted the item is always visible (e.g. Dashboard).
 * Slugs should match what your API returns on rolePermissions.
 */
const navItems = [
  { label: 'Dashboard',        href: '/',                  icon: <Dashboard /> },
  { label: 'Products',         href: '/products',          icon: <Inventory />,          permission: 'product_list' },
  { label: 'Product Variants', href: '/product-variants',  icon: <Tune />,               permission: 'product_variant_list' },
  { label: 'Categories',       href: '/categories',        icon: <Category />,           permission: 'category_list' },
  { label: 'Orders',           href: '/orders',            icon: <ShoppingCart />,       permission: 'order_list' },
  { label: 'Users',            href: '/users',             icon: <People />,             permission: 'users_list' },
  { label: 'Login Logs',       href: '/logs',              icon: <ManageSearch />,       permission: 'login_logs_list' },
  { label: 'Roles',            href: '/roles',             icon: <AdminPanelSettings />, permission: 'roles_list' },
  { label: 'Countries',        href: '/countries',         icon: <Public />,             permission: 'country_list' },
  { label: 'States',           href: '/states',            icon: <Map />,                permission: 'state_list' },
  { label: 'Cities',           href: '/cities',            icon: <LocationCity />,       permission: 'city_list' },
  { label: 'Invoices',         href: '/invoices',          icon: <Receipt />,            permission: 'invoice_list' },
  { label: 'Delivery',         href: '/delivery',          icon: <LocalShipping />,      permission: 'delivery_list' },
  { label: 'Support',          href: '/support',           icon: <Support />,            permission: 'support_list' },
  { label: 'Analytics',        href: '/analytics',         icon: <BarChart />,           permission: 'analytics_list' },
  { label: 'Settings',         href: '/settings',          icon: <Settings />,           permission: 'settings_list' },
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
  const pathname      = usePathname();
  const { can }       = usePermissions();

  // Filter nav items by permission (items without a permission are always shown)
  const visibleItems  = navItems.filter((item) => !item.permission || can(item.permission));

  const content = (
    <Box sx={{ width: open ? width : miniWidth, minHeight: '100vh', background: '#0F172A', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', overflow: 'hidden', height: '100vh' }}>
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
      <List sx={{ flex: 1, py: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return <NavItem key={item.href} item={item} open={open} active={active} />;
        })}
      </List>
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
