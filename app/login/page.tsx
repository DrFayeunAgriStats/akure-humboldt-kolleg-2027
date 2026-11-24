import {Shell} from '@/components/Shell';
import {LoginForm} from './form';
import {safeNext} from '@/lib/redirect';

export const metadata = {
  title: 'Sign in',
  description: 'Secure email sign-in for Akure Humboldt Kolleg 2027 participants, reviewers and organisers.',
  alternates: {canonical: '/login'},
  robots: {index: false, follow: false}
};

export default async function Page({searchParams}: {searchParams: Promise<{error?: string; next?: string; mode?: string; password?: string}>}) {
  const {error, next, mode, password} = await searchParams;
  const action = mode === 'create' || mode === 'recover' ? mode : 'login';
  const title = {login: 'Sign in', create: 'Create a portal account', recover: 'Set or reset your password'}[action];
  return <Shell title={title} kicker="Conference portal">
    {error && <p className="message error" role="alert">The email link could not be verified. Request a new password setup link and open it in the same browser.</p>}
    {password === 'updated' && <p className="message success" role="status">Your password has been updated. Sign in with your new password.</p>}
    <LoginForm key={action} mode={action} next={safeNext(next)} />
  </Shell>;
}
