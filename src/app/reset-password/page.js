'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Alert, Chip,
} from '@mui/material';
import {
  Lock, Visibility, VisibilityOff,
  ArrowBack, AccessTime,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { resetPasswordRequest, parseZodErrors } from '@/lib/auth';

// OTP_VALIDITY_SECONDS matches backend (10 minutes)
const OTP_VALIDITY_SECONDS = 10 * 60;

function ResetPasswordForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const prefillEmail  = searchParams.get('email') || '';

  const [form, setForm] = useState({
    email:           prefillEmail,
    otp:             '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(OTP_VALIDITY_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const timerExpired = secondsLeft === 0;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errors = {};

    if (!form.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!form.otp) {
      errors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(form.otp)) {
      errors.otp = 'OTP must be exactly 6 digits';
    }

    if (!form.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.confirmPassword !== form.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (timerExpired) {
      setGeneralError('OTP has expired. Please request a new one from Forgot Password.');
      return;
    }

    const localErrors = validate();
    if (Object.keys(localErrors).length) { setFieldErrors(localErrors); return; }

    setSubmitting(true);
    const toastId = toast.loading('Resetting password…');

    try {
      await resetPasswordRequest({
        email:           form.email,
        otp:             form.otp,
        newPassword:     form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      clearInterval(timerRef.current);

      toast.update(toastId, {
        render: '🔑 Password reset successfully! Please sign in.',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || 'Failed to reset password.';
      const errors  = err?.response?.data?.errors;

      toast.update(toastId, { render: message, type: 'error', isLoading: false, autoClose: 4000 });

      if (status === 422 && errors?.length) {
        const fieldMap = parseZodErrors(errors);
        setFieldErrors(fieldMap);
        if (!Object.keys(fieldMap).length) setGeneralError(message);
      } else {
        setGeneralError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_without_bg.png"
                alt="Protine Web"
                style={{ height: 120, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B4332' }}>
              Reset Password
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Enter the OTP sent to your email
            </Typography>
          </Box>

          {/* OTP timer */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <Chip
              icon={<AccessTime fontSize="small" />}
              label={timerExpired ? 'OTP Expired' : `OTP expires in ${minutes}:${seconds}`}
              color={timerExpired ? 'error' : secondsLeft < 120 ? 'warning' : 'success'}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: 13 }}
            />
          </Box>

          {timerExpired && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              OTP has expired.{' '}
              <Link href="/forgot-password" style={{ color: 'inherit', fontWeight: 700 }}>
                Request a new one
              </Link>
            </Alert>
          )}

          {generalError && !timerExpired && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {generalError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              sx={{ mb: 2.5 }}
            />

            {/* OTP */}
            <TextField
              fullWidth
              label="6-Digit OTP"
              type="text"
              inputMode="numeric"
              value={form.otp}
              onChange={(e) => {
                // Accept only digits, max 6
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setField('otp', val);
              }}
              error={!!fieldErrors.otp}
              helperText={fieldErrors.otp || 'Enter the 6-digit code from your email'}
              slotProps={{
                htmlInput: { maxLength: 6, style: { letterSpacing: '0.4em', fontWeight: 700, fontSize: 20 } },
              }}
              sx={{ mb: 2.5 }}
            />

            {/* New Password */}
            <TextField
              fullWidth
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setField('newPassword', e.target.value)}
              error={!!fieldErrors.newPassword}
              helperText={fieldErrors.newPassword || 'Minimum 6 characters'}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew((v) => !v)} edge="end" aria-label="Toggle new password">
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2.5 }}
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" aria-label="Toggle confirm password">
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting || timerExpired}
              sx={{
                py: 1.5, fontSize: 16, fontWeight: 700,
                background: 'linear-gradient(135deg, #0F172A, #1B4332)',
                '&:hover': { background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' },
                mb: 2,
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
          </Box>

          {/* Back to login */}
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/login" passHref>
              <Button
                startIcon={<ArrowBack fontSize="small" />}
                variant="text"
                sx={{ color: '#1B4332', fontWeight: 600, textTransform: 'none' }}
              >
                Back to Sign In
              </Button>
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
          <CircularProgress sx={{ color: '#F59E0B' }} />
        </Box>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
