import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';
import {SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY} from './lib/supabase/public-config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defence in depth against cross-site request forgery. Session cookies are
 * SameSite=Lax already; additionally, any state-changing API request whose
 * browser-supplied Origin (or Sec-Fetch-Site) shows it came from another site
 * is refused before it reaches a route handler.
 */
function isCrossSiteWrite(request: NextRequest) {
  if (SAFE_METHODS.has(request.method) || !request.nextUrl.pathname.startsWith('/api/')) return false;
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true;
  const origin = request.headers.get('origin');
  if (!origin) return false; // non-browser clients send no Origin and carry no session cookie
  try {
    return new URL(origin).host !== (request.headers.get('x-forwarded-host') || request.headers.get('host'));
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  if (isCrossSiteWrite(request)) {
    return NextResponse.json({error: 'Cross-site requests are not allowed.'}, {status: 403, headers: {'Cache-Control': 'no-store'}});
  }
  if (!SUPABASE_PUBLIC_URL || !SUPABASE_PUBLIC_KEY) return NextResponse.next({request});
  let response = NextResponse.next({request});
  const supabase = createServerClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items) {
        items.forEach(({name, value}) => request.cookies.set(name, value));
        response = NextResponse.next({request});
        items.forEach(({name, value, options}) => response.cookies.set(name, value, options));
      }
    }
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
