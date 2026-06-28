/**
 * auth.js — Pure async helpers for login, logout, forgot/reset password,
 * and token refresh. Used by AdminContext and individual auth pages.
 */
import { authAPI, permissionsAPI } from './api';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const TOKEN_KEY         = 'adminToken';
const REFRESH_TOKEN_KEY = 'adminRefreshToken';
const USER_KEY          = 'adminUser';
const PERMISSIONS_KEY   = 'adminPermissions';

// ─── Storage helpers ──────────────────────────────────────────────────────────
export function saveAuthData({ token, refreshToken, user, permissions }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (permissions !== undefined) {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  }
}

export function clearAuthData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
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

export function getStoredPermissions() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

/**
 * Login with email + password, or phone + password.
 * Returns { user, token, refreshToken } on success; throws string error message on failure.
 */
export async function loginRequest(identifier, password, isPhone = false) {
  const payload = isPhone
    ? { phone: identifier, password }
    : { email: identifier, password };
  const res = await authAPI.login(payload);
  const { user, token, refreshToken } = res.data;
  saveAuthData({ token, refreshToken, user });
  return { user, token, refreshToken };
}

/**
 * Send OTP — accepts either { phone } or { email } depending on which the user provides.
 * Returns the success message string.
 */
export async function sendLoginOtpRequest(identifier, isEmail = false) {
  const payload = isEmail ? { email: identifier } : { phone: identifier };
  const res = await authAPI.sendLoginOtp(payload);
  return res.message;
}

/**
 * Verify OTP and log in — accepts either phone or email as identifier.
 * otp must be a number (integer).
 * Returns { user, token, refreshToken } on success.
 */
export async function verifyLoginOtpRequest(identifier, otp, isEmail = false) {
  const payload = isEmail
    ? { email: identifier, otp: Number(otp) }
    : { phone: identifier, otp: Number(otp) };
  const res = await authAPI.verifyLoginOtp(payload);
  const { user, token, refreshToken } = res.data;
  saveAuthData({ token, refreshToken, user });
  return { user, token, refreshToken };
}

/**
 * Fetch the current admin's permissions from /permissions/detail.
 * Stores the result in localStorage and returns the permissions data.
 * Must be called after the token is already saved (so the request is authenticated).
 */
export async function fetchAndStorePermissions(role_id) {
  try {
    const res = await permissionsAPI.detail(role_id);
    // API may return { data: ... } or the permissions object directly
    const permissions = res?.data ?? res;
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    return permissions;
  } catch {
    // Non-fatal — permissions will be empty; user will have restricted access
    return null;
  }
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
