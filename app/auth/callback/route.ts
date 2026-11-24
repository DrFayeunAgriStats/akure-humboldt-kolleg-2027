import {NextRequest, NextResponse} from 'next/server';
import {getSupabaseServer, hasConfig} from '@/lib/supabase/server';
import {NEXT_COOKIE, safeNext} from '@/lib/redirect';

function toLogin(req: NextRequest, error: string) {
  const res = NextResponse.redirect(new URL('/login?error=' + error, req.url));
  res.cookies.delete(NEXT_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Supabase reports link problems (e.g. otp_expired) as query parameters instead of a code.
  const errorCode = url.searchParams.get('error_code') || url.searchParams.get('error');
  if (errorCode) return toLogin(req, /expired|otp|access_denied/i.test(errorCode) ? 'expired' : 'auth');
  const code = url.searchParams.get('code');
  if (!hasConfig()) return toLogin(req, 'config');
  if (!code) return toLogin(req, 'invalid');
  const db = await getSupabaseServer();
  const flowId = url.searchParams.get('sb_flow_id');
  const {data, error} = await db.auth.exchangeCodeForSession(code, flowId ? {flowId} : undefined);
  if (error) return toLogin(req, /expired|already/i.test(error.message) ? 'expired' : 'auth');
  const destination = safeNext(req.cookies.get(NEXT_COOKIE)?.value);
  // The PKCE exchange identifies recovery independently of the optional
  // navigation cookie, which may be missing when an email link is opened.
  const recovery = 'redirectType' in data && data.redirectType === 'recovery';
  const target = recovery && !destination.startsWith('/set-password?')
    ? '/set-password?next=' + encodeURIComponent(destination)
    : destination;
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.delete(NEXT_COOKIE);
  return res;
}
