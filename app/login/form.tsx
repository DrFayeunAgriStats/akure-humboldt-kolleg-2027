'use client';
import Link from 'next/link';
import {FormEvent, useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY} from '@/lib/supabase/public-config';
import {NEXT_COOKIE} from '@/lib/redirect';

type Mode = 'login' | 'create' | 'recover' | 'set';
const labels = {login: 'Sign in', create: 'Create account', recover: 'Send password setup link', set: 'Save password'};

export function LoginForm({next, mode}: {next: string; mode: Mode}) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const destination = encodeURIComponent(next);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const email = String(fields.get('email') || '').trim();
    const password = String(fields.get('password') || '');
    if (mode === 'set' && password !== String(fields.get('confirm_password') || '')) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      if (!SUPABASE_PUBLIC_URL || !SUPABASE_PUBLIC_KEY) throw new Error('Sign-in is temporarily unavailable.');
      const {auth} = createBrowserClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY);
      if (mode === 'login' || mode === 'set') {
        const result = mode === 'login' ? await auth.signInWithPassword({email, password}) : await auth.updateUser({password});
        if (result.error) throw result.error;
        if (mode === 'set') {
          const {error} = await auth.signOut({scope: 'local'});
          if (error) throw error;
          window.location.assign('/login?password=updated&next=' + destination);
          return;
        }
      } else {
        const callback = location.origin + '/auth/callback';
        const target = mode === 'recover' ? '/set-password?next=' + destination : next;
        document.cookie = NEXT_COOKIE + '=' + encodeURIComponent(target) + '; path=/; max-age=3600; samesite=lax' + (location.protocol === 'https:' ? '; secure' : '');
        if (mode === 'recover') {
          const {error} = await auth.resetPasswordForEmail(email, {redirectTo: callback});
          if (error) throw error;
          setNotice('If this address has an account, open the password setup email in this browser.');
          return;
        }
        const {data, error} = await auth.signUp({email, password, options: {emailRedirectTo: callback}});
        if (error) throw error;
        if (!data.session) {
          setNotice('Check your inbox to confirm your new account. If you already have an account, sign in or reset your password.');
          return;
        }
      }
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete this request. Please try again.');
    } finally { setBusy(false); }
  }
  return <>
    <form className="app-form" onSubmit={submit}>
      {mode !== 'set' && <label>Email address<input required name="email" type="email" autoComplete="username" /></label>}
      {mode !== 'recover' && <label>{mode === 'login' ? 'Password' : 'New password'}
        <input required name="password" type="password" minLength={mode === 'login' ? undefined : 8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}
      {mode === 'set' && <label>Confirm new password
        <input required name="confirm_password" type="password" minLength={8} autoComplete="new-password" /></label>}
      <button disabled={busy}>{busy ? 'Please wait…' : labels[mode]}</button>
      {error && <p role="alert" className="message error">{error}</p>}
      {notice && <p role="status" className="message success">{notice}</p>}
    </form>
    {mode === 'login' ? <>
      <p><Link href={'/login?mode=recover&next=' + destination}>Set or reset your password</Link></p>
      <p><Link href={'/login?mode=create&next=' + destination}>Create a portal account</Link></p>
    </> : <p><Link href={'/login?next=' + destination}>Back to sign in</Link></p>}
  </>;
}
