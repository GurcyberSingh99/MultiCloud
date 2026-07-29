import client from './client';

export const authAPI = {
  login: (email, password) => client.post('/auth/login/', { email, password }),
  register: (name, email, password) => client.post('/auth/register/', { name, email, password }),
  refresh: (refresh_token) => client.post('/auth/refresh/', { refresh_token }),
  getProfile: () => client.get('/auth/profile/'),
  updateProfile: (data) => client.put('/auth/profile/', data),
};

export const vmAPI = {
  list: (params) => client.get('/vms/', { params }),
  get: (id) => client.get(`/vms/${id}/`),
  create: (data) => client.post('/vms/', data),
  delete: (id) => client.delete(`/vms/${id}/`),
  action: (id, data) => client.post(`/vms/${id}/action/`, data),
};

export const storageAPI = {
  list: (params) => client.get('/storage/', { params }),
  get: (id) => client.get(`/storage/${id}/`),
  create: (data) => client.post('/storage/', data),
  delete: (id) => client.delete(`/storage/${id}/`),
  stats: () => client.get('/storage/stats/'),
};

export const billingAPI = {
  summary: () => client.get('/billing/summary/'),
  daily: (days) => client.get('/billing/daily/', { params: { days } }),
  services: () => client.get('/billing/services/'),
  forecast: () => client.get('/billing/forecast/'),
  budgets: () => client.get('/billing/budgets/'),
};

export const monitoringAPI = {
  metrics: (params) => client.get('/monitoring/metrics/', { params }),
  network: (params) => client.get('/monitoring/network/', { params }),
  health: (params) => client.get('/monitoring/health/', { params }),
  utilization: () => client.get('/monitoring/utilization/'),
};

export const alertsAPI = {
  list: (params) => client.get('/alerts/', { params }),
  acknowledge: (id) => client.post(`/alerts/${id}/ack/`),
  rules: () => client.get('/alerts/rules/'),
  createRule: (data) => client.post('/alerts/rules/', data),
  history: () => client.get('/alerts/history/'),
};

export const analyticsAPI = {
  distribution: () => client.get('/analytics/distribution/'),
  trends: () => client.get('/analytics/trends/'),
  optimization: () => client.get('/analytics/optimization/'),
  comparison: () => client.get('/analytics/comparison/'),
};

export const cloudAPI = {
  providers: () => client.get('/cloud/providers/'),
  getCredentials: (provider) => client.get('/cloud/credentials/', { params: { provider } }),
  saveCredentials: (provider, credentials) => client.post('/cloud/credentials/', { provider, credentials }),
  testCredentials: (provider, credentials) => client.post('/cloud/credentials/test/', { provider, credentials }),
};

