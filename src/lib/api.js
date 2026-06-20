/**
 * api.js — Admin API layer for Protine Web
 */
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.protineweb.com/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAuthAPI = {
  login:   (data) => api.post('/admin/auth/login', data),
  logout:  ()     => api.post('/admin/auth/logout'),
  profile: ()     => api.get('/admin/auth/profile'),
};

export const productsAPI = {
  getAll:  (params) => api.get('/products', { params }),
  getById: (id)     => api.get(`/products/${id}`),
  create:  (data)   => api.post('/products', data),
  update:  (id, data) => api.put(`/products/${id}`, data),
  delete:  (id)     => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  getAll:  ()       => api.get('/categories'),
  getById: (id)     => api.get(`/categories/${id}`),
  create:  (data)   => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id)     => api.delete(`/categories/${id}`),
};

export const ordersAPI = {
  getAll:       (params)       => api.get('/orders', { params }),
  getById:      (id)           => api.get(`/orders/${id}`),
  updateStatus: (id, status)   => api.put(`/orders/${id}/status`, { status }),
  cancel:       (id)           => api.put(`/orders/${id}/cancel`),
};

export const usersAPI = {
  getAll:  (params) => api.get('/users', { params }),
  getById: (id)     => api.get(`/users/${id}`),
  update:  (id, data) => api.put(`/users/${id}`, data),
  delete:  (id)     => api.delete(`/users/${id}`),
};

export const invoicesAPI = {
  getAll:    (params) => api.get('/invoices', { params }),
  getById:   (id)     => api.get(`/invoices/${id}`),
  download:  (id)     => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
};

export const supportAPI = {
  getTickets:    ()         => api.get('/support/tickets'),
  getTicketById: (id)       => api.get(`/support/tickets/${id}`),
  replyTicket:   (id, data) => api.post(`/support/tickets/${id}/reply`, data),
  closeTicket:   (id)       => api.put(`/support/tickets/${id}/close`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/admin/analytics/dashboard'),
  getRevenue:   (params) => api.get('/admin/analytics/revenue', { params }),
};

export default api;
