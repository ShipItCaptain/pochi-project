import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  requestOtp: (data) => api.post('/auth/request-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

export const fundraiserApi = {
  list: () => api.get('/fundraisers'),
  create: (data) => api.post('/fundraisers', data),
  get: (id) => api.get(`/fundraisers/${id}`),
  update: (id, data) => api.put(`/fundraisers/${id}`, data),
  delete: (id) => api.delete(`/fundraisers/${id}`),
  summary: (id) => api.get(`/fundraisers/${id}/summary`),
  connectDaraja: (id) => api.post(`/fundraisers/${id}/connect-daraja`),
  connectWhatsapp: (id, data) => api.post(`/fundraisers/${id}/connect-whatsapp`, data),
  exportPdf: (id) => api.get(`/fundraisers/${id}/export/pdf`, { responseType: 'blob' }),
  exportExcel: (id) => api.get(`/fundraisers/${id}/export/excel`, { responseType: 'blob' }),
}

export const contributorApi = {
  list: (fundraiserId) => api.get(`/fundraisers/${fundraiserId}/contributors`),
  listUnpaid: (fundraiserId) => api.get(`/fundraisers/${fundraiserId}/contributors/unpaid`),
  get: (fundraiserId, cid) => api.get(`/fundraisers/${fundraiserId}/contributors/${cid}`),
  update: (fundraiserId, cid, data) => api.put(`/fundraisers/${fundraiserId}/contributors/${cid}`, data),
  delete: (fundraiserId, cid) => api.delete(`/fundraisers/${fundraiserId}/contributors/${cid}`),
  remind: (fundraiserId, cid) => api.post(`/fundraisers/${fundraiserId}/contributors/${cid}/remind`),
  getRegistrationInfo: (token) => api.get(`/register/${token}`),
  register: (token, data) => api.post(`/register/${token}`, data),
}

export const transactionApi = {
  list: (fundraiserId) => api.get(`/fundraisers/${fundraiserId}/transactions`),
  listUnmatched: (fundraiserId) => api.get(`/fundraisers/${fundraiserId}/transactions/unmatched`),
  match: (fundraiserId, tid, data) => api.post(`/fundraisers/${fundraiserId}/transactions/${tid}/match`, data),
  get: (fundraiserId, tid) => api.get(`/fundraisers/${fundraiserId}/transactions/${tid}`),
}

export const subscriptionApi = {
  plans: () => api.get('/subscriptions/plans'),
  initiate: (data) => api.post('/subscriptions/initiate', data),
  status: () => api.get('/subscriptions/status'),
  history: () => api.get('/subscriptions/history'),
}

export const whatsappApi = {
  status: () => api.get('/whatsapp/status'),
  qr: () => api.get('/whatsapp/qr'),
  groups: () => api.get('/whatsapp/groups'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  reinit: () => api.post('/whatsapp/reinit'),
}

export default api
