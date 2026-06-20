'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAdmin } from '@/context/AdminContext';

export default function LoginPage() {
  const router = useRouter();
  const { dispatch } = useAdmin();
  const [form, setForm]               = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please enter both email and password.'); return; }

    setLoading(true);
    const toastId = toast.loading('Signing in...');
    try {
      // Replace with: const res = await adminAuthAPI.login(form);
      await new Promise((r) => setTimeout(r, 900));
      const adminUser = { id: 1, name: 'Admin User', email: form.email, role: 'super_admin' };
      localStorage.setItem('adminToken', 'admin-token');
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      dispatch({ type: 'SET_ADMIN', payload: adminUser });
      toast.update(toastId, { render: `👋 Welcome back, ${adminUser.name}!`, type: 'success', isLoading: false, autoClose: 2000 });
      router.push('/');
    } catch (err) {
      toast.update(toastId, { render: err?.response?.data?.message || 'Login failed.', type: 'error', isLoading: false, autoClose: 4000 });
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1B4332 50%, #0F172A 100%)', py: 4 }}>
      <Container maxWidth="xs">
        <Paper sx={{ p: 5, borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(27,67,50,0.4)' }}>
              <AdminPanelSettings sx={{ fontSize: 36, color: '#F59E0B' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B4332' }}>Admin Panel</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Protine Web — Management Console</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField fullWidth label="Admin Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> } }}
              sx={{ mb: 2.5 }} />
            <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label="Toggle password">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #0F172A, #1B4332)', '&:hover': { background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'text.disabled' }}>
            Restricted access — authorized personnel only
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

