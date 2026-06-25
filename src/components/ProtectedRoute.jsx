'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAdmin } from '@/context/AdminContext';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * ProtectedRoute — wraps any page that requires authentication.
 *
 * Props:
 *   requiredPermission  string | null  — permission slug required to access the page
 *   requiredRoleId      number | null  — (legacy) role id check
 */
export default function ProtectedRoute({
  children,
  requiredPermission = null,
  requiredRoleId     = null,
}) {
  const { isAuthenticated, isLoading, admin } = useAdmin();
  const { can, isSuperAdmin }                 = usePermissions();
  const router                                = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    // Legacy role-id guard
    if (requiredRoleId !== null && admin?.role_id !== requiredRoleId) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, admin, requiredRoleId, router]);

  // Still loading or not authed → spinner / redirect
  if (isLoading || !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          bgcolor:        '#0F172A',
        }}
      >
        <CircularProgress sx={{ color: '#F59E0B' }} />
      </Box>
    );
  }

  // Permission check (skip for super_admin)
  if (requiredPermission && !isSuperAdmin && !can(requiredPermission)) {
    return (
      <Box
        sx={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:            2,
          bgcolor:        '#F1F5F0',
        }}
      >
        <LockOutlined sx={{ fontSize: 56, color: '#B91C1C', opacity: 0.7 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C1917' }}>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don&apos;t have permission to view this page.
        </Typography>
        <Button variant="contained" onClick={() => router.replace('/')}
          sx={{ mt: 1, background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
