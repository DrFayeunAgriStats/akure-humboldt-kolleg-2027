/** Name of the short-lived cookie that remembers where to go after the email sign-in link. */
export const NEXT_COOKIE = 'akh_next';

/** Accept only same-site relative paths, so the post-login redirect cannot be used as an open redirect. */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value) return fallback;
  let path = value;
  try { path = decodeURIComponent(value); } catch { return fallback; }
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\r\n]/.test(path)) return fallback;
  if (path.startsWith('/auth/') || path.startsWith('/login')) return fallback;
  return path;
}
