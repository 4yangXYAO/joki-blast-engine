import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Shared HTTP client factory.
 * Provides a pre-configured axios instance with timeout and base URL.
 * Adapters should use this instead of raw axios to ensure consistent behavior.
 */
export function createHttpClient(opts: {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}): AxiosInstance {
  return axios.create({
    baseURL: opts.baseURL,
    timeout: opts.timeout ?? 15_000,
    headers: opts.headers ?? {},
  });
}

/**
 * Parse a cookie string or JSON array of {name, value} into a single Cookie header string.
 * Accepts:
 *   - Plain string: "key=val; key2=val2"
 *   - JSON string: '[{"name":"key","value":"val"}]'
 */
export function parseCookies(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr: Array<{ name: string; value: string }> = JSON.parse(trimmed);
      return arr.map((c) => `${c.name}=${c.value}`).join('; ');
    } catch {
      // Fall through to plain string
    }
  }
  return trimmed;
}

export type { AxiosRequestConfig };
