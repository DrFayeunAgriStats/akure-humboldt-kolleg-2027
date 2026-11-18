'use client';
import {FormEvent, useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY} from '@/lib/supabase/public-config';
import {NEXT_COOKIE} from '@/lib/redirect';

function friendly(message: string) {
  if (/rate limit|only request this after|too many/i.test(message))
    return 'A sign-in link was requested very recently. Please wait a minute, then try again.';
  if (/invalid.*email|email.*invalid/i.test(message)) return 'Please enter a valid email address.';
  if (/fetch|network/i.test(message)) return 'We could not reach the sign-in service. Check your connection and try again.';
  return message || 'Sign-in failed. Please try again.';
}

export function LoginForm({next}: {next: string}) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (!SUPABASE_PUBLIC_URL || !SUPABASE_PUBLIC_KEY) throw new Error('Sign-in is temporarily unavailable.');
      // Remember the destination in a cookie rather than the redirect URL, so the
      // Supabase redirect allow-list only ever needs the plain /auth/callback URL.
      document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=1800; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
      const client = createBrowserClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY);
      const {error} = await client.auth.signInWithOtp({email: email.trim(), options: {emailRedirectTo: location.origin + '/auth/callback'}});
      if (error) throw error;
      setSentTo(email.trim());
    } catch (err) {
      const msg = friendly(err instanceof Error ? err.message : '');
      setError(msg);
    } finally { setBusy(false); }
  }

  if (sentTo) return <div className="message success" role="status">
    <strong>Check your inbox.</strong> We sent a sign-in link to <strong>{sentTo}</strong>. Open it in this browser to continue.
    It can take a minute to arrive. Check your spam folder too.
    <p><button type="button" className="app-btn-link" onClick={() => setSentTo('')}>Use a different email address</button></p>
  </div>;

  return <form className="app-form" onSubmit={submit} noValidate={false}>
    <label>Email address
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email"
        aria-invalid={error ? true : undefined} aria-describedby={error ? 'login-error' : undefined} />
    </label>
    <button disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
    {error && <div id="login-error" role="alert" className="message error">{error}</div>}
  </form>;
}
