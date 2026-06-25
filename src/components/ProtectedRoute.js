'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAdmin } from '@/context/AdminContext';

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * While auth state is loading from localStorage it shows a spinner.
 * If not authenticated it redirects to /login.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <YourPage />
 *   </ProtectedRoute>
 *
 * Optional props:
 *   requiredRoleId — number | null  (e.g. 1 for super-admin)
 */
export default function ProtectedRoute({ children, requiredRoleId = null }) {
  const { isAuthenticated, isLoading, admin } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Role-based guard (optional)
    if (requiredRoleId !== null && admin?.role_id !== requiredRoleId) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, admin, requiredRoleId, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0F172A',
        }}
      >
        <CircularProgress sx={{ color: '#F59E0B' }} />
      </Box>
    );
  }

  return <>{children}</>;
}
