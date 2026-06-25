'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, Paper, Typography, Button,
  InputAdornment, CircularProgress, Alert,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { forgotPasswordRequest, parseZodErrors } from '@/lib/auth';
import { TextInput } from '@/components/ui';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validateEmail = (val) => {
    if (!val)                                      return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setEmailError('');
    setSuccessMsg('');
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }

    setSubmitting(true);
    const toastId = toast.loading('Sending OTP…');
    try {
      const message = await forgotPasswordRequest(email);
      toast.update(toastId, { render: '✅ OTP sent! Check your inbox.', type: 'success', isLoading: false, autoClose: 3000 });
      setSuccessMsg(message || 'OTP sent to your email successfully');
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1500);
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || 'Something went wrong. Please try again.';
      const errors  = err?.response?.data?.errors;
      toast.update(toastId, { render: message, type: 'error', isLoading: false, autoClose: 4000 });
      if (status === 422 && errors?.length) {
        const fieldMap = parseZodErrors(errors);
        setEmailError(fieldMap.email || '');
        if (!fieldMap.email) setGeneralError(message);
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
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #f5f7fa 100%)',
        py: 4, position: 'relative', overflow: 'hidden',
        '&::before': { content: '""', position: 'absolute', top: '-120px', left: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,67,50,0.18) 0%, transparent 70%)', zIndex: 0 },
        '&::after':  { content: '""', position: 'absolute', bottom: '-100px', right: '-100px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', zIndex: 0 },
      }}
    >
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, boxShadow: '0 20px 60px rgba(27,67,50,0.15), 0 4px 16px rgba(0,0,0,0.08)', border: '1px solid rgba(27,67,50,0.08)' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_without_bg.png" alt="Protine Web" style={{ height: 120, width: 'auto', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B4332' }}>Forgot Password</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Enter your email and we&apos;ll send you a 6-digit OTP
            </Typography>
          </Box>

          {successMsg && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {successMsg} — redirecting to reset password…
            </Alert>
          )}
          {generalError && !successMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{generalError}</Alert>
          )}

          {!successMsg && (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                error={emailError}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> },
                }}
                sx={{ mb: 3 }}
              />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting}
                sx={{ py: 1.5, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #0F172A, #1B4332)', '&:hover': { background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }, mb: 2 }}>
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Link href="/login" passHref>
              <Button startIcon={<ArrowBack fontSize="small" />} variant="text"
                sx={{ color: '#1B4332', fontWeight: 600, textTransform: 'none' }}>
                Back to Sign In
              </Button>
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
