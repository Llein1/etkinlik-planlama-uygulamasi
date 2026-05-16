export const API_PREFIX = '/api';

export function apiUrl(path: string): string {
  return `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
}