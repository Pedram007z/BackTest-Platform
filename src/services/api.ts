import { local } from '../lib/storage';

/**
 * HTTP client for the BacktestLab API server (server/). Set VITE_API_URL at build time, e.g.
 * VITE_API_URL=https://api.example.ir. Without it the app runs fully in the browser ("demo mode"):
 * accounts, admin data and payments are simulated locally and market data / news are samples.
 */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
export const hasServer = API_URL.length > 0;

const TOKEN_KEY = 'backtest-auth:token';
export const getToken = () => local.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? local.setItem(TOKEN_KEY, t) : local.removeItem(TOKEN_KEY));

/** Address of an uploaded picture or video: the API server's /api/media/… or a blob: address (demo). */
export const mediaSrc = (url: string) => (url.startsWith('/api/') ? `${API_URL}${url}` : url);

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError(0, 'network', 'اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.code ?? 'error', data?.message ?? 'خطای سرور', data?.field);
  return data as T;
}

/** A file from the API (a journal screenshot), with the sign-in token. */
export async function apiBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers });
  } catch {
    throw new ApiError(0, 'network', 'اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.code ?? 'error', data?.message ?? 'خطای سرور', data?.field);
  }
  return res.blob();
}
