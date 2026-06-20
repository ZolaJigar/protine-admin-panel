'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAdmin } from '@/context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const SIDEBAR_WIDTH      = 260;
const SIDEBAR_WIDTH_MINI = 72;

export default function AdminShell({ children }) {
  const { state } = useAdmin();
  const router    = useRouter();
  const pathname  = usePathname();

  useEffect(() => {
    if (!state.isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [state.isAuthenticated, pathname, router]);

  if (!state.isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
        <CircularProgress sx={{ color: '#F59E0B' }} />
      </Box>
    );
  }

  const open = state.sidebarOpen;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F0' }}>
      <AdminSidebar open={open} width={SIDEBAR_WIDTH} miniWidth={SIDEBAR_WIDTH_MINI} />
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: { xs: 0, md: `${open ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_MINI}px` },
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <AdminTopbar sidebarWidth={open ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_MINI} />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, pt: { xs: 10, md: 11 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
