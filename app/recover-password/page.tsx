'use client';

import Link from 'next/link';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {Shell} from '@/components/Shell';
import {SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY} from '@/lib/supabase/public-config';

export default function RecoverPassword() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function continueRecovery() {
    const tokenHash = new URLSearchParams(window.location.hash.slice(1)).get('token_hash');
    if (!tokenHash) {
      setError('Open the link in your password reset email, or request a fresh link below.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const {auth} = createBrowserClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY);
      const result = await auth.verifyOtp({type: 'recovery', token_hash: tokenHash});
      if (result.error || !result.data.session) {
        setError('This password reset link is invalid or has expired. Request a fresh link below.');
        return;
      }
      window.location.replace('/set-password');
    } catch {
      setError('Unable to reach the sign-in service. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return <Shell title="Reset your password" kicker="Conference portal">
    <p>Continue to choose a new password for your conference account.</p>
    <button className="btn btn-primary" disabled={busy} onClick={continueRecovery}>
      {busy ? 'Verifying…' : 'Continue to choose password'}
    </button>
    {error && <p role="alert">{error}</p>}
    <p><Link href="/login?mode=recover">Request a fresh reset link</Link></p>
  </Shell>;
}
