const API_BASE_URL = 'http://localhost:3001/api';

// Auth token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => authToken;

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(response.token);
    return response;
  },

  register: async (userData: {
    username: string;
    password: string;
    name: string;
    email: string;
    phone?: string;
  }) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setAuthToken(response.token);
    return response;
  },

  verify: async () => {
    return apiRequest('/auth/verify');
  },

  logout: () => {
    setAuthToken(null);
  },
};

// Pumps API
export const pumpsAPI = {
  getAll: () => apiRequest('/pumps'),
  
  getById: (id: string) => apiRequest(`/pumps/${id}`),
  
  updateStatus: (id: string, status: string, estimatedTime?: number) =>
    apiRequest(`/pumps/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, estimated_time: estimatedTime }),
    }),
  
  updateMaintenance: (id: string, maintenanceDate: string) =>
    apiRequest(`/pumps/${id}/maintenance`, {
      method: 'PUT',
      body: JSON.stringify({ maintenance_date: maintenanceDate }),
    }),
  
  getStats: (id: string) => apiRequest(`/pumps/${id}/stats`),
};

// Queue API
export const queueAPI = {
  getAll: () => apiRequest('/queue'),
  
  add: (customerData: {
    customer_name: string;
    fuel_type: string;
    phone_number: string;
    email: string;
    priority?: 'normal' | 'high';
  }) => apiRequest('/queue', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),
  
  remove: (id: string) => apiRequest(`/queue/${id}`, { method: 'DELETE' }),
  
  serveNext: (pumpId: string) => apiRequest(`/queue/serve-next/${pumpId}`, { method: 'POST' }),
  
  updatePriority: (id: string, priority: 'normal' | 'high') =>
    apiRequest(`/queue/${id}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority }),
    }),
  
  getStats: () => apiRequest('/queue/stats'),
};

// Reservations API
export const reservationsAPI = {
  getAll: (params?: { status?: string; date?: string }) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/reservations${queryParams ? `?${queryParams}` : ''}`);
  },
  
  create: (reservationData: {
    customer_name: string;
    fuel_type: string;
    phone_number: string;
    email: string;
    reservation_time: string;
    estimated_liters: number;
    total_amount: number;
  }) => apiRequest('/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData),
  }),
  
  updateStatus: (id: string, status: string) =>
    apiRequest(`/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  assignPump: (id: string, pumpId: string) =>
    apiRequest(`/reservations/${id}/assign-pump`, {
      method: 'PUT',
      body: JSON.stringify({ pump_id: pumpId }),
    }),
  
  delete: (id: string) => apiRequest(`/reservations/${id}`, { method: 'DELETE' }),
  
  getAvailableSlots: (date: string, fuelType: string) =>
    apiRequest(`/reservations/available-slots?date=${date}&fuel_type=${fuelType}`),
  
  getStats: () => apiRequest('/reservations/stats'),
};

// Payments API
export const paymentsAPI = {
  createIntent: (paymentData: {
    amount: number;
    currency?: string;
    customerName: string;
    email: string;
  }) => apiRequest('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),
  
  process: (paymentData: {
    amount: number;
    method: string;
    customerName: string;
    email: string;
    cardNumber?: string;
    stripePaymentId?: string;
    pumpId?: string;
    queueId?: string;
    reservationId?: string;
  }) => apiRequest('/payments/process', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),
  
  getHistory: (params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest(`/payments/history${queryParams ? `?${queryParams}` : ''}`);
  },
  
  getStats: () => apiRequest('/payments/stats'),
};

// Analytics API
export const analyticsAPI = {
  getAll: (period?: string) => apiRequest(`/analytics${period ? `?period=${period}` : ''}`),
  
  getDashboard: () => apiRequest('/analytics/dashboard'),
  
  getPerformance: () => apiRequest('/analytics/performance'),
  
  getPredictions: () => apiRequest('/analytics/predictions'),
};

// Notifications API
export const notificationsAPI = {
  sendQueuePosition: (data: {
    phoneNumber: string;
    email: string;
    customerName: string;
    position: number;
    estimatedTime: number;
  }) => apiRequest('/notifications/queue-position', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  sendTurn: (data: {
    phoneNumber: string;
    email: string;
    customerName: string;
    pumpNumber: number;
  }) => apiRequest('/notifications/turn', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  sendReservationConfirmation: (data: {
    phoneNumber: string;
    email: string;
    customerName: string;
    reservationTime: string;
    totalAmount: number;
  }) => apiRequest('/notifications/reservation-confirmation', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getHistory: (params?: { limit?: number; offset?: number; type?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest(`/notifications/history${queryParams ? `?${queryParams}` : ''}`);
  },
  
  getStats: () => apiRequest('/notifications/stats'),
};

// IoT API
export const iotAPI = {
  getSensors: (pumpId?: string) => apiRequest(`/iot/sensors${pumpId ? `/${pumpId}` : ''}`),
  
  getMaintenance: () => apiRequest('/iot/maintenance'),
  
  getStatus: () => apiRequest('/iot/status'),
  
  simulate: (pumpId: string, event: string) => apiRequest(`/iot/simulate/${pumpId}`, {
    method: 'POST',
    body: JSON.stringify({ event }),
  }),
};

export default {
  auth: authAPI,
  pumps: pumpsAPI,
  queue: queueAPI,
  reservations: reservationsAPI,
  payments: paymentsAPI,
  analytics: analyticsAPI,
  notifications: notificationsAPI,
  iot: iotAPI,
};