import {Shell} from '@/components/Shell';
import {LoginForm} from './form';
import {safeNext} from '@/lib/redirect';

export const metadata = {
  title: 'Sign in',
  description: 'Secure email sign-in for Akure Humboldt Kolleg 2027 participants, reviewers and organisers.',
  alternates: {canonical: '/login'},
  robots: {index: false, follow: false}
};

const ERRORS: Record<string, string> = {
  expired: 'That sign-in link has expired or has already been used. Links work once and expire after a short time. Request a new link below.',
  invalid: 'That sign-in link is incomplete or invalid. Please request a new link below, and open it in the same browser where you requested it.',
  auth: 'We could not complete your sign-in. Request a new link below and open it in the same browser. If this keeps happening, contact the organisers.',
  config: 'Sign-in is temporarily unavailable. Please try again later.'
};

export default async function Page({searchParams}: {searchParams: Promise<{error?: string; next?: string}>}) {
  const {error, next} = await searchParams;
  const message = error ? ERRORS[error] || ERRORS.auth : null;
  return <Shell title="Sign in" kicker="PARTICIPANTS, REVIEWERS & ORGANISERS">
    {message && <div className="message error" role="alert"><strong>Sign-in link problem.</strong> {message}</div>}
    <p>Enter your email address and we will send you a one-time sign-in link. No password is needed.
      Reviewer and organiser access is assigned by the organising committee.</p>
    <LoginForm next={safeNext(next)} />
  </Shell>;
}
