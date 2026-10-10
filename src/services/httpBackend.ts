import { API_URL, ApiError, api, apiBlob, getToken } from './api';
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
const delJson = <T>(path: string) => wrap(api<T>(path, { method: 'DELETE' }));
const enc = encodeURIComponent;

/** Sends a picture or video as the request body (XMLHttpRequest, for the progress bar). */
function upload<T>(path: string, file: File, onProgress?: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data: any = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else if (xhr.status === 413 && !data) reject(new BackendError('too_large', 'حجم فایل بیش از حد مجاز سرور است.', 'media'));
      else reject(new BackendError(data?.code ?? 'error', data?.message ?? 'بارگذاری انجام نشد.', data?.field ?? 'media'));
    };
    xhr.onerror = () => reject(new BackendError('network', 'اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.', 'media'));
    xhr.send(file);
  });
}
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
  backtestCheck: (hash) => post('/api/me/backtests/check', { hash }),
  backtestUpload: (hash, snapshot) => put('/api/me/backtests', { hash, snapshot }),
  workspace: (rev) => get(`/api/me/workspace${rev === undefined ? '' : `?rev=${rev}`}`),
  saveWorkspace: (input, opts) => wrap(api('/api/me/workspace', { method: 'POST', json: input, keepalive: opts?.keepalive })),
  layouts: (sessionId) => get(`/api/me/layouts/${enc(sessionId)}`),
  saveLayout: (sessionId, input, opts) => wrap(api(`/api/me/layouts/${enc(sessionId)}`, { method: 'PUT', json: input, keepalive: opts?.keepalive })),
  shot: (id) => wrap(apiBlob(`/api/me/shots/${enc(id)}`)),
  saveShot: (id, image) => wrap(api<void>(`/api/me/shots/${enc(id)}`, { method: 'PUT', body: image, headers: { 'Content-Type': image.type || 'image/jpeg' } })),
  deleteShot: (id) => del(`/api/me/shots/${enc(id)}`),
  announcements: (placement) => get(`/api/announcements?placement=${placement}`),
  announcementSeen: (id) => post(`/api/announcements/${enc(id)}/view`),
  latestBlogPosts: (limit) => get(`/api/blog/latest?limit=${limit}`),
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
    startNewsHistory: (input) => post('/api/admin/news/history', input),
    stopNewsHistory: () => post('/api/admin/news/history/stop'),
    marketStorage: () => get('/api/admin/market/storage'),
    startMarketDownload: (input) => post('/api/admin/market/download', input),
    stopMarketDownload: () => post('/api/admin/market/download/stop'),
    qverisStatus: () => get('/api/admin/market/qveris'),
    startMarketImport: (input) => post('/api/admin/market/import', input),
    stopMarketImport: () => post('/api/admin/market/import/stop'),
    credentials: () => get('/api/admin/credentials'),
    saveCredentials: (input) => put('/api/admin/credentials', input),
    removeCredentials: () => del('/api/admin/credentials'),
    backtests: (q) => get(`/api/admin/backtests${qs(q)}`),
    backtestDetail: (userId) => get(`/api/admin/backtests/${enc(userId)}`),
    deleteBacktestSession: (userId, sessionId) => del(`/api/admin/backtests/${enc(userId)}/sessions/${enc(sessionId)}`),
    activity: (q) => get(`/api/admin/activity${qs(q)}`),
    userDevices: (userId) => get(`/api/admin/users/${enc(userId)}/devices`),
    signOutDevices: (userId, deviceId) => delJson(`/api/admin/users/${enc(userId)}/devices${deviceId ? `/${enc(deviceId)}` : ''}`),
    announcements: () => get('/api/admin/announcements'),
    saveAnnouncement: (a) => put(`/api/admin/announcements/${enc(a.id)}`, a),
    deleteAnnouncement: (id) => del(`/api/admin/announcements/${enc(id)}`),
    uploadMedia: (file, onProgress) => upload(`/api/admin/media?name=${enc(file.name)}`, file, onProgress),
    blogPosts: () => get('/api/admin/blog'),
    blogPost: (id) => get(`/api/admin/blog/${enc(id)}`),
    saveBlogPost: (p) => put(`/api/admin/blog/${enc(p.id)}`, p),
    deleteBlogPost: (id) => del(`/api/admin/blog/${enc(id)}`),
  },
};
