import { generateIdempotencyKey } from '../security';
import { getStoredToken } from '../../utils';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000/smartbank';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  clientId?: string;
  idempotencyKey?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const timestamp = new Date().toISOString();
  const token = getStoredToken();
  const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Id': options.clientId ?? 'smartbank-web-console',
    'X-Timestamp': timestamp,
    'X-Signature': 'placeholder-generated-server-side',
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (isMutating) headers['Idempotency-Key'] = options.idempotencyKey ?? generateIdempotencyKey();

  /*
   * HMAC signatures need a client_secret, which must not be stored in the browser.
   * Production integrations should sign from a trusted backend or server-side route,
   * then forward the signed request to SmartBank.
   */
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`SmartBank API error ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function mockDelay<T>(value: T, delay = 120): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, delay));
  return value;
}
