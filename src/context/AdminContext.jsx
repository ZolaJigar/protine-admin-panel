'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearAuthData,
  getStoredUser,
  getStoredToken,
  getStoredRefreshToken,
  getStoredPermissions,
  loginRequest,
  sendLoginOtpRequest,
  verifyLoginOtpRequest,
  refreshTokenRequest,
  saveAuthData,
  fetchAndStorePermissions,
} from '@/lib/auth';

// ─── State shape ─────────────────────────────────────────────────────────────
const initialState = {
  admin:           null,   // user object from API
  token:           null,
  refreshToken:    null,
  permissions:     null,   // permissions from /permissions/detail
  isAuthenticated: false,
  isLoading:       true,   // true until we've checked localStorage
  sidebarOpen:     true,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function adminReducer(state, action) {
  switch (action.type) {

    case 'HYDRATE':
      return {
        ...state,
        admin:           action.payload.user,
        token:           action.payload.token,
        refreshToken:    action.payload.refreshToken,
        permissions:     action.payload.permissions ?? null,
        isAuthenticated: !!action.payload.token,
        isLoading:       false,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        admin:           action.payload.user,
        token:           action.payload.token,
        refreshToken:    action.payload.refreshToken,
        permissions:     action.payload.permissions ?? null,
        isAuthenticated: true,
        isLoading:       false,
      };

    case 'PERMISSIONS_LOADED':
      return {
        ...state,
        permissions: action.payload,
      };

    case 'TOKEN_REFRESHED':
      return {
        ...state,
        token:        action.payload.token,
        refreshToken: action.payload.refreshToken,
      };

    case 'LOGOUT':
      return {
        ...state,
        admin:           null,
        token:           null,
        refreshToken:    null,
        permissions:     null,
        isAuthenticated: false,
        isLoading:       false,
      };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const router            = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token        = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    const user         = getStoredUser();
    const permissions  = getStoredPermissions();

    dispatch({
      type:    'HYDRATE',
      payload: {
        user:         user  || null,
        token:        token || null,
        refreshToken: refreshToken || null,
        permissions:  permissions  || null,
      },
    });

    // If we have a token but no cached permissions, fetch them in the background
    if (token && !permissions) {
      fetchAndStorePermissions(user?.role_id).then((permissions) => {
        if (permissions) {
          dispatch({ type: 'PERMISSIONS_LOADED', payload: permissions });
        }
      });
    }
  }, []);

  // ── login (email + password, or phone + password) ───────────────────────
  const login = useCallback(async (identifier, password, isPhone = false) => {
    const { user, token, refreshToken } = await loginRequest(identifier, password, isPhone);
    const permissions = await fetchAndStorePermissions(user.role_id);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token, refreshToken, permissions } });
    return user;
  }, []);

  // ── loginWithOtp (phone or email + OTP) ──────────────────────────────────────
  const loginWithOtp = useCallback(async (identifier, otp, isEmail = false) => {
    const { user, token, refreshToken } = await verifyLoginOtpRequest(identifier, otp, isEmail);
    const permissions = await fetchAndStorePermissions(user.role_id);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token, refreshToken, permissions } });
    return user;
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuthData();
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  }, [router]);

  // ── refreshAccessToken ───────────────────────────────────────────────────
  const refreshAccessToken = useCallback(async () => {
    const storedRefresh = getStoredRefreshToken();
    if (!storedRefresh) { logout(); return null; }

    try {
      const { token, refreshToken } = await refreshTokenRequest(storedRefresh);
      dispatch({ type: 'TOKEN_REFRESHED', payload: { token, refreshToken } });
      return token;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  const value = {
    state,
    dispatch,
    // Convenience accessors
    admin:           state.admin,
    token:           state.token,
    permissions:     state.permissions,
    isAuthenticated: state.isAuthenticated,
    isLoading:       state.isLoading,
    // Auth actions
    login,
    loginWithOtp,
    logout,
    refreshAccessToken,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
