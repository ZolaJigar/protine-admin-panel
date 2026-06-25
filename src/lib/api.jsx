/**
 * api.js — Standalone API helpers (GET, POST, PUT, DELETE, OPTIONS, file variants)
 * Mirrors the aeonxPortal api pattern, adapted for this project.
 */
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminRefreshToken');
}

function getHeaders(contentType = 'application/json') {
  const token = getToken();
  return {
    'Content-Type': contentType,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Error extractor ─────────────────────────────────────────────────────────
function extractError(error) {
  if (!error.response) return 'Something went wrong!';

  const data = error.response?.data;
  if (!data) return 'Something went wrong!';

  const msg = data.message;

  if (msg === 'User Session has Expired!' || msg === 'Token has expired') {
    const refreshTkn = getRefreshToken();
    if (refreshTkn) {
      window.location.reload();
    }
    return 'Session Expired! Please login again.';
  }

  if (msg === 'User Blocked!') {
    window.location.reload();
    return 'User Blocked.';
  }

  if (typeof msg === 'object') {
    return msg?.detail ?? msg?.[0] ?? 'Something went wrong!';
  }

  return msg ?? data?.detail ?? 'Something went wrong!';
}

// ─── apiGet ───────────────────────────────────────────────────────────────────
export const apiGet = (apiURL = '/URL_HERE', params = {}) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = {
    headers: {
      ...getHeaders(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    params,
  };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(url, headerConfig);
      resolve(response.data);
    } catch (error) {
      reject(extractError(error));
    }
  });
};

// ─── apiPost ──────────────────────────────────────────────────────────────────
export const apiPost = (
  apiURL = '/URL_HERE',
  data = {},
  params = {},
  contentType = 'application/json'
) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = { headers: getHeaders(contentType), params };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(url, data, headerConfig);
      if (response.data?.error) {
        reject(response.data.message);
      } else {
        resolve(response.data);
      }
    } catch (error) {
      reject(extractError(error));
    }
  });
};

// ─── apiPut ───────────────────────────────────────────────────────────────────
export const apiPut = (
  apiURL = '/URL_HERE',
  data = {},
  params = {},
  contentType = 'application/json'
) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = { headers: getHeaders(contentType), params };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.put(url, data, headerConfig);
      resolve(response.data);
    } catch (error) {
      reject(extractError(error));
    }
  });
};

// ─── apiDelete ────────────────────────────────────────────────────────────────
export const apiDelete = (apiURL = '/URL_HERE', data = {}) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = { data, headers: getHeaders() };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.delete(url, headerConfig);
      resolve(response.data);
    } catch (error) {
      reject(extractError(error));
    }
  });
};

// ─── apiPatch ─────────────────────────────────────────────────────────────────
export const apiPatch = (apiURL = '/URL_HERE', data = {}) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = { headers: getHeaders() };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.patch(url, data, headerConfig);
      resolve(response.data);
    } catch (error) {
      reject(extractError(error));
    }
  });
};

// ─── apiOptions ───────────────────────────────────────────────────────────────
export const apiOptions = (apiURL = '/URL_HERE', params = {}) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = { headers: getHeaders(), params };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.options(url, headerConfig);
      resolve(response.data);
    } catch (error) {
      reject(error.message);
    }
  });
};

// ─── apiGetFile ───────────────────────────────────────────────────────────────
export const apiGetFile = (apiURL = '/URL_HERE', params = {}) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = {
    headers: getHeaders(),
    params,
    responseType: 'blob',
  };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(url, headerConfig);
      resolve(response);
    } catch (error) {
      if (error.response?.data) {
        reject(error.response.data.detail ?? 'Something went wrong!');
      } else {
        reject('Something went wrong!');
      }
    }
  });
};

// ─── apiPostFile ──────────────────────────────────────────────────────────────
export const apiPostFile = (apiURL = '/URL_HERE', data = {}, params = {}) => {
  const url          = BASE_URL + apiURL;
  const headerConfig = {
    headers: getHeaders(),
    params,
    responseType: 'blob',
  };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(url, data, headerConfig);
      resolve(response);
    } catch (error) {
      if (error.response) {
        reject('No Data Found For This Date.');
      } else {
        reject('Something went wrong!');
      }
    }
  });
};

// ─── Resource endpoints (thin wrappers using the helpers above) ───────────────

export const authAPI = {
  login:          (data) => apiPost('/auth/login', data),
  forgotPassword: (data) => apiPost('/auth/forgot-password', data),
  resetPassword:  (data) => apiPost('/auth/reset-password', data),
  refreshToken:   (data) => apiPost('/auth/refresh-token', data),
};

export const categoriesAPI = {
  list:    (params)       => apiPost('/categories/list', params),
  getById: (id)           => apiGet(`/categories/${id}`),
  create:  (formData)     => apiPost('/categories/create', formData, {}, 'multipart/form-data'),
  update:  (id, formData) => apiPut(`/categories/update/${id}`, formData, {}, 'multipart/form-data'),
  delete:  (id)           => apiDelete(`/categories/delete/${id}`),
};

export const productsAPI = {
  list:    (params)       => apiPost('/products/list', params),
  getById: (id)           => apiGet(`/products/${id}`),
  create:  (formData)     => apiPost('/products/create', formData, {}, 'multipart/form-data'),
  update:  (id, formData) => apiPut(`/products/update/${id}`, formData, {}, 'multipart/form-data'),
  delete:  (id)           => apiDelete(`/products/delete/${id}`),
};

export const ordersAPI = {
  getAll:       (params)       => apiGet('/orders', params),
  getById:      (id)           => apiGet(`/orders/${id}`),
  updateStatus: (id, status)   => apiPut(`/orders/${id}/status`, { status }),
  cancel:       (id)           => apiPut(`/orders/${id}/cancel`),
};

export const usersAPI = {
  list:   (params)       => apiPost('/users/list', params),
  create: (formData)     => apiPost('/users/create', formData, {}, 'multipart/form-data'),
  update: (id, formData) => apiPut(`/users/update/${id}`, formData, {}, 'multipart/form-data'),
  delete: (id)           => apiDelete(`/users/delete/${id}`),
};

export const rolesAPI = {
  list:         (params)   => apiPost('/roles/list', params),
  getById:      (id)       => apiGet(`/roles/${id}`),
  create:       (data)     => apiPost('/roles/create', data),
  update:       (id, data) => apiPut(`/roles/update/${id}`, data),
  delete:       (id)       => apiDelete(`/roles/delete/${id}`),
  toggleActive: (id)       => apiPatch(`/roles/role-active/${id}`),
  assignUser:   (data)     => apiPut('/roles/assign-user', data),
};

export const permissionsAPI = {
  list: (params) => apiPost('/permissions/list', params),
};

export const countriesAPI = {
  list:    (params)   => apiPost('/countries/list', params),
  getById: (id)       => apiGet(`/countries/${id}`),
  create:  (data)     => apiPost('/countries/create', data),
  update:  (id, data) => apiPut(`/countries/update/${id}`, data),
  delete:  (id)       => apiDelete(`/countries/delete/${id}`),
};

export const statesAPI = {
  list:    (params)   => apiPost('/states/list', params),
  getById: (id)       => apiGet(`/states/${id}`),
  create:  (data)     => apiPost('/states/create', data),
  update:  (id, data) => apiPut(`/states/update/${id}`, data),
  delete:  (id)       => apiDelete(`/states/delete/${id}`),
};

export const citiesAPI = {
  list:    (params)   => apiPost('/cities/list', params),
  getById: (id)       => apiGet(`/cities/${id}`),
  create:  (data)     => apiPost('/cities/create', data),
  update:  (id, data) => apiPut(`/cities/update/${id}`, data),
  delete:  (id)       => apiDelete(`/cities/delete/${id}`),
};

export const logsAPI = {
  loginLogs: (params) => apiPost('/logs/login-logs', params),
};

export const productVariantsAPI = {
  list:    (params)       => apiPost('/product-variants/list', params),
  getById: (id)           => apiGet(`/product-variants/${id}`),
  create:  (formData)     => apiPost('/product-variants/create', formData, {}, 'multipart/form-data'),
  update:  (id, formData) => apiPut(`/product-variants/update/${id}`, formData, {}, 'multipart/form-data'),
  delete:  (id)           => apiDelete(`/product-variants/delete/${id}`),
};

export const invoicesAPI = {
  getAll:   (params) => apiGet('/invoices', params),
  getById:  (id)     => apiGet(`/invoices/${id}`),
  download: (id)     => apiGetFile(`/invoices/${id}/download`),
};

export const supportAPI = {
  getTickets:    ()         => apiGet('/support/tickets'),
  getTicketById: (id)       => apiGet(`/support/tickets/${id}`),
  replyTicket:   (id, data) => apiPost(`/support/tickets/${id}/reply`, data),
  closeTicket:   (id)       => apiPut(`/support/tickets/${id}/close`),
};

export const analyticsAPI = {
  getDashboard: ()       => apiGet('/admin/analytics/dashboard'),
  getRevenue:   (params) => apiGet('/admin/analytics/revenue', params),
};
