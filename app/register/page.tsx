import Link from 'next/link';
import {Shell, TestModeNotice} from '@/components/Shell';
import {RegisterForm} from './form';
import {getSupabaseServer, currentUser} from '@/lib/supabase/server';
import {participantTestMode, getConferenceSettings, registrationState, registrationReference, formatDeadline} from '@/lib/conference-mode';

export const metadata = {
  title: 'Registration',
  description: 'Register to attend Akure Humboldt Kolleg 2027 at FUTA, Akure, 15–18 March 2027. Participation is free.',
  alternates: {canonical: '/register'}
};
export const dynamic = 'force-dynamic';

const CATEGORY: Record<string, string> = {student: 'Student', academic: 'Researcher / academic', professional: 'Professional / practitioner', other: 'Other'};

export default async function Page() {
  const settings = await getConferenceSettings();
  const testing = await participantTestMode(settings);
  const state = registrationState(settings);
  const user = await currentUser();
  let existing: {serial_number: number; full_name: string; institution: string; category: string; created_at: string; is_demo: boolean} | null = null;
  if (user) {
    const db = await getSupabaseServer();
    const r = await db.from('registrations')
      .select('serial_number,full_name,institution,category,created_at,is_demo')
      .eq('user_id', user.id).eq('is_demo', testing).maybeSingle();
    existing = r.data;
  }

  return <Shell title="Registration" kicker="15–18 March 2027 · Free participation" intro="Register once to attend the Kolleg and to submit abstracts. It takes about two minutes."
    notice={<TestModeNotice show={testing && state === 'open'} />}>
    <p className="lead-copy">The Kolleg is fully sponsored. <strong>There is no registration fee</strong> and no payment step.</p>

    {existing ? <section className="plain-card summary-card" aria-labelledby="reg-summary">
      <span className="eyebrow-small">{existing.is_demo ? 'TEST REGISTRATION' : 'YOUR REGISTRATION'}</span>
      <h2 id="reg-summary">{registrationReference(existing.serial_number, existing.is_demo)}</h2>
      <dl className="detail-list">
        <div><dt>Name</dt><dd>{existing.full_name}</dd></div>
        <div><dt>Institution</dt><dd>{existing.institution}</dd></div>
        <div><dt>Category</dt><dd>{CATEGORY[existing.category] || existing.category}</dd></div>
        <div><dt>Registered</dt><dd>{new Date(existing.created_at).toLocaleDateString('en-GB', {dateStyle: 'long', timeZone: 'Africa/Lagos'})}</dd></div>
      </dl>
      <p className="help">To correct these details, contact the organisers quoting your reference.</p>
      <div className="action-row">
        <Link className="app-button" href="/submit">Submit an abstract</Link>
        <Link className="app-button app-btn-secondary" href="/dashboard">Go to my portal</Link>
      </div>
    </section>

    : state === 'open' ? (user
      ? <>
          {settings.registration_deadline && <p className="help">Registration closes {formatDeadline(settings.registration_deadline)}.</p>}
          <p>Signed in as <strong>{user.email}</strong>. Your confirmation will be sent to this address.</p>
          <RegisterForm />
        </>
      : <div className="plain-card cta-card">
          <h2>Start your registration</h2>
          <ol className="step-list">
            <li>Sign in with your email and password.</li>
            <li>Complete the short registration form (about 2 minutes).</li>
            <li>Receive your registration reference by email.</li>
          </ol>
          <Link className="app-button" href="/login?next=/register">Sign in to register</Link>
        </div>)

    : <div className="message" role="status">
        <strong>{state === 'deadline-passed' ? 'Registration has closed.' : state === 'unavailable' ? 'Registration is temporarily unavailable.' : 'Registration is not open yet.'}</strong>{' '}
        {state === 'deadline-passed' ? 'The registration deadline has passed. Contact the organisers if you have a question.'
          : state === 'unavailable' ? 'Please try again shortly.'
          : 'Registration will open once the organising committee announces it. Explore the scientific themes and programme in the meantime.'}{' '}
        <Link href="/">Conference homepage</Link>
      </div>}
  </Shell>;
}
