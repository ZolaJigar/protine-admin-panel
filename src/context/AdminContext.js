'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const initialState = {
  admin: null,
  isAuthenticated: false,
  sidebarOpen: true,
};

function adminReducer(state, action) {
  switch (action.type) {
    case 'SET_ADMIN':
      return { ...state, admin: action.payload, isAuthenticated: !!action.payload };
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
      return { ...state, admin: null, isAuthenticated: false };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    default:
      return state;
  }
}

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminUser');
      if (saved) {
        try { dispatch({ type: 'SET_ADMIN', payload: JSON.parse(saved) }); }
        catch { localStorage.removeItem('adminUser'); }
      }
    }
  }, []);

  return (
    <AdminContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
