'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Alert,
} from '@mui/material';
import {
  Email, Lock, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAdmin } from '@/context/AdminContext';
import { parseZodErrors } from '@/lib/auth';

export default function LoginPage() {
  const router              = useRouter();
  const { login, isAuthenticated, isLoading } = useAdmin();

  const [form, setForm]             = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});   // Zod field errors

  // If already authenticated, skip login page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the field error as user types
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.email)                              errors.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
    if (!form.password)                           errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const localErrors = validate();
    if (Object.keys(localErrors).length) { setFieldErrors(localErrors); return; }

    setSubmitting(true);
    const toastId = toast.loading('Signing in…');

    try {
      const user = await login(form.email, form.password);
      toast.update(toastId, {
        render: `👋 Welcome back, ${user.name}!`,
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
      router.push('/');
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || 'Login failed. Please try again.';
      const errors  = err?.response?.data?.errors;

      toast.update(toastId, { render: message, type: 'error', isLoading: false, autoClose: 4000 });

      if (status === 422 && errors?.length) {
        setFieldErrors(parseZodErrors(errors));
      } else {
        setGeneralError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show spinner while checking stored auth state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
        <CircularProgress sx={{ color: '#F59E0B' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #f5f7fa 100%)',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        // Decorative blobs
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-120px',
          left: '-120px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27,67,50,0.18) 0%, transparent 70%)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(27,67,50,0.15), 0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid rgba(27,67,50,0.08)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_without_bg.png"
                alt="Protine Web"
                style={{ height: 120, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
          </Box>

          {/* General error (401 / 429 / 500) */}
          {generalError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {generalError}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2.5 }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1 }}
            />

            {/* Forgot Password link */}
            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Link href="/forgot-password" passHref>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: '#1B4332',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    '&:hover': { color: '#2D6A4F' },
                  }}
                >
                  Forgot Password?
                </Typography>
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                py: 1.5, fontSize: 16, fontWeight: 700,
                background: 'linear-gradient(135deg, #0F172A, #1B4332)',
                '&:hover': { background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' },
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'text.disabled' }}
          >
            Restricted access — authorized personnel only
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
