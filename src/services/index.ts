import { hasServer } from './api';
import type { Backend } from './backend';
import { httpBackend } from './httpBackend';
import { localBackend } from './localBackend';

/** The API server when VITE_API_URL is set, otherwise the in-browser demo backend. */
export const backend: Backend = hasServer ? httpBackend : localBackend;
export { BackendError } from './backend';
export type { AuthResult, CheckoutResult, OtpRequest } from './backend';
