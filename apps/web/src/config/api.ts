const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent)) {
    return DEFAULT_API_BASE;
  }

  if (import.meta.env.DEV) {
    return '';
  }

  return DEFAULT_API_BASE;
}
