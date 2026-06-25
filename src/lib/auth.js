/**
 * auth.js — Pure async helpers for login, logout, forgot/reset password,
 * and token refresh. Used by AdminContext and individual auth pages.
 */
import { authAPI } from './api';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const TOKEN_KEY         = 'adminToken';
const REFRESH_TOKEN_KEY = 'adminRefreshToken';
const USER_KEY          = 'adminUser';

// ─── Storage helpers ──────────────────────────────────────────────────────────
export function saveAuthData({ token, refreshToken, user }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

/**
 * Login with email + password.
 * apiPost resolves with response.data, so shape expected: { data: { user, token, refreshToken } }
 * Returns { user, token, refreshToken } on success; throws string error message on failure.
 */
export async function loginRequest(email, password) {
  const res = await authAPI.login({ email, password });
  const { user, token, refreshToken } = res.data;
  saveAuthData({ token, refreshToken, user });
  return { user, token, refreshToken };
}

/**
 * Send forgot-password OTP to the given email.
 * Returns the success message string.
 */
export async function forgotPasswordRequest(email) {
  const res = await authAPI.forgotPassword({ email });
  return res.message;
}

/**
 * Reset password using OTP.
 * otp must be a number (parsed before calling this).
 * Returns the success message string.
 */
export async function resetPasswordRequest({ email, otp, newPassword, confirmPassword }) {
  const res = await authAPI.resetPassword({
    email,
    otp: Number(otp),
    newPassword,
    confirmPassword,
  });
  return res.message;
}

/**
 * Exchange a refresh token for a new token pair.
 * Returns { token, refreshToken }.
 */
export async function refreshTokenRequest(refreshToken) {
  const res = await authAPI.refreshToken({ refreshToken });
  const { token: newToken, refreshToken: newRefresh } = res.data;
  saveAuthData({
    token:        newToken,
    refreshToken: newRefresh,
    user:         getStoredUser(),
  });
  return { token: newToken, refreshToken: newRefresh };
}

// ─── Zod error parser ─────────────────────────────────────────────────────────
/**
 * Extract a field-level error map from a 422 response.
 * Each Zod error has shape: { path: string[], message: string }
 * Returns: { fieldName: "error message", ... }
 */
export function parseZodErrors(errors = []) {
  const map = {};
  errors.forEach((err) => {
    const field = Array.isArray(err.path) ? err.path[err.path.length - 1] : err.path;
    if (field && !map[field]) map[field] = err.message;
  });
  return map;
}
