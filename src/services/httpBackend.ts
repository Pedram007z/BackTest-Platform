import { ApiError, api } from './api';
import { BackendError, type Backend } from './backend';

/** Backend over the API server in server/. Routes mirror the method names. */

const wrap = async <T>(p: Promise<T>): Promise<T> => {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError) throw new BackendError(e.code, e.message, e.field);
    throw e;
  }
};
const get = <T>(path: string) => wrap(api<T>(path));
const post = <T>(path: string, json?: unknown) => wrap(api<T>(path, { method: 'POST', json: json ?? {} }));
const put = <T>(path: string, json: unknown) => wrap(api<T>(path, { method: 'PUT', json }));
const del = (path: string) => wrap(api<void>(path, { method: 'DELETE' }));
const qs = (o: object) =>
  '?' +
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export const httpBackend: Backend = {
  mode: 'server',
  siteConfig: () => get('/api/config'),
  requestOtp: (phone) => post('/api/auth/otp', { phone }),
  verifyOtp: (phone, code, name) => post('/api/auth/verify', { phone, code, name }),
  demoLogin: () => Promise.reject(new BackendError('unsupported', 'حساب نمایشی فقط در نسخه‌ی بدون سرور در دسترس است.')),
  adminLogin: (username, password, key) => post('/api/auth/admin-login', { key, username, password }),
  adminGate: (key) =>
    post('/api/auth/admin-gate', { key }).then(
      () => true,
      (e) => {
        // a wrong key looks like a missing address; other errors (server down) are reported
        if (e instanceof BackendError && e.code === 'not_found') return false;
        throw e;
      },
    ),
  me: () => get('/api/me'),
  updateMe: (patch) => put('/api/me', patch),
  logout: () => post('/api/auth/logout'),
  plans: () => get('/api/plans'),
  gateways: () => get('/api/payments/gateways'),
  checkDiscount: (code, planId) => post('/api/payments/discount', { code, planId }),
  checkout: (input) => post('/api/payments/checkout', input),
  payment: (id) => get(`/api/payments/${encodeURIComponent(id)}`),
  reportTransfer: (id, input) => post(`/api/payments/${encodeURIComponent(id)}/sent`, input),
  cancelTransfer: (id) => post(`/api/payments/${encodeURIComponent(id)}/cancel`),
  myPayments: () => get('/api/me/payments'),
  myTickets: () => get('/api/me/tickets'),
  createTicket: (subject, text) => post('/api/me/tickets', { subject, text }),
  replyMyTicket: (id, text) => post(`/api/me/tickets/${encodeURIComponent(id)}/reply`, { text }),
  admin: {
    stats: () => get('/api/admin/stats'),
    users: (q) => get(`/api/admin/users${qs(q)}`),
    updateUser: (id, patch) => put(`/api/admin/users/${encodeURIComponent(id)}`, patch),
    deleteUser: (id) => del(`/api/admin/users/${encodeURIComponent(id)}`),
    plans: () => get('/api/admin/plans'),
    savePlan: (plan) => put(`/api/admin/plans/${encodeURIComponent(plan.id)}`, plan),
    deletePlan: (id) => del(`/api/admin/plans/${encodeURIComponent(id)}`),
    payments: (q) => get(`/api/admin/payments${qs(q)}`),
    refundPayment: (id) => post(`/api/admin/payments/${encodeURIComponent(id)}/refund`),
    confirmPayment: (id, refId) => post(`/api/admin/payments/${encodeURIComponent(id)}/confirm`, { refId }),
    rejectPayment: (id, reason) => post(`/api/admin/payments/${encodeURIComponent(id)}/reject`, { reason }),
    cards: () => get('/api/admin/cards'),
    saveCard: (c) => put(`/api/admin/cards/${encodeURIComponent(c.id)}`, c),
    deleteCard: (id) => del(`/api/admin/cards/${encodeURIComponent(id)}`),
    saveCardSettings: (s) => put('/api/admin/cards/settings', s),
    discounts: () => get('/api/admin/discounts'),
    saveDiscount: (d) => put(`/api/admin/discounts/${encodeURIComponent(d.id)}`, d),
    deleteDiscount: (id) => del(`/api/admin/discounts/${encodeURIComponent(id)}`),
    gateways: () => get('/api/admin/gateways'),
    saveGateway: (g) => put(`/api/admin/gateways/${g.id}`, g),
    testGateway: (id) => post(`/api/admin/gateways/${id}/test`),
    sms: () => get('/api/admin/sms'),
    saveSms: (s) => put('/api/admin/sms', s),
    testSms: (to) => post('/api/admin/sms/test', { to }),
    bulkSms: (input) => post('/api/admin/sms/bulk', input),
    smsLogs: () => get('/api/admin/sms/logs'),
    tickets: () => get('/api/admin/tickets'),
    replyTicket: (id, text) => post(`/api/admin/tickets/${encodeURIComponent(id)}/reply`, { text }),
    setTicketStatus: (id, status) => put(`/api/admin/tickets/${encodeURIComponent(id)}`, { status }),
    settings: () => get('/api/admin/settings'),
    saveSettings: (s) => put('/api/admin/settings', s),
    audit: () => get('/api/admin/audit'),
    newsStatus: () => get('/api/admin/news'),
    syncNews: () => post('/api/admin/news/sync'),
    marketStorage: () => get('/api/admin/market/storage'),
    startMarketDownload: (input) => post('/api/admin/market/download', input),
    stopMarketDownload: () => post('/api/admin/market/download/stop'),
    credentials: () => get('/api/admin/credentials'),
    saveCredentials: (input) => put('/api/admin/credentials', input),
    removeCredentials: () => del('/api/admin/credentials'),
  },
};
