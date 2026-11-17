import Link from 'next/link';
import {Shell, TestModeNotice} from '@/components/Shell';
import {AbstractForm} from './form';
import {currentUser, getSupabaseServer} from '@/lib/supabase/server';
import {getConferenceSettings, submissionState, formatDeadline} from '@/lib/conference-mode';
import {THEMES} from '@/lib/themes';

export const metadata = {
  title: 'Call for abstracts',
  description: 'Submit a 250–300-word abstract to Akure Humboldt Kolleg 2027 under one of five sub-themes on biodiversity, climate change and food security.',
  alternates: {canonical: '/submit'}
};
export const dynamic = 'force-dynamic';

export default async function Page() {
  const settings = await getConferenceSettings();
  const state = submissionState(settings);
  const user = await currentUser();
  let registered = false;
  if (user) {
    const db = await getSupabaseServer();
    const r = await db.from('registrations').select('id').eq('user_id', user.id).eq('is_demo', settings.demo_mode).maybeSingle();
    registered = Boolean(r.data);
  }

  return <Shell title="Call for abstracts" kicker="FIVE SUB-THEMES · 250–300 WORDS"
    notice={<TestModeNotice show={settings.demo_mode && state === 'open'} />}>
    <div className="guidelines">
      <p className="lead-copy">Submit research under one of the five sub-themes. Submission is free; abstracts stay private unless accepted and released by the scientific committee.</p>
      <details className="plain-card">
        <summary>Sub-themes and author guidelines</summary>
        <ol className="theme-list">{THEMES.map((t, i) => <li key={i}>{t}</li>)}</ol>
        <ul>
          <li>Length: 250–300 words, plain text.</li>
          <li>Presenting author must be registered for the Kolleg.</li>
          <li>Optional attachment: PDF, DOC or DOCX, up to 2 MB, visible only to organisers and assigned reviewers.</li>
          <li>Indicate your preference for an oral or poster presentation.</li>
        </ul>
      </details>
      {settings.abstract_deadline && <p className="help">Submission deadline: <strong>{formatDeadline(settings.abstract_deadline)}</strong>.</p>}
    </div>

    {state !== 'open'
      ? <div className="message" role="status">
          <strong>{state === 'deadline-passed' ? 'Abstract submission has closed.' : state === 'unavailable' ? 'Abstract submission is temporarily unavailable.' : 'Abstract submission is not open yet.'}</strong>{' '}
          {state === 'closed' ? 'The call will open when the organising committee announces it.' : state === 'unavailable' ? 'Please try again shortly.' : 'Contact the organisers if you have a question.'}{' '}
          <Link href="/">Conference homepage</Link>
        </div>
      : !user
        ? <div className="plain-card cta-card">
            <h2>Before you submit</h2>
            <ol className="step-list">
              <li>Sign in with a one-time email link.</li>
              <li>Register for the Kolleg (free, about 2 minutes).</li>
              <li>Submit your abstract and track its review in your portal.</li>
            </ol>
            <Link className="app-button" href="/login?next=/submit">Sign in to continue</Link>
          </div>
        : !registered
          ? <div className="plain-card cta-card">
              <h2>Register first</h2>
              <p>You are signed in as <strong>{user.email}</strong>. Please complete your free registration, then return here.</p>
              <Link className="app-button" href="/register">Register now</Link>
            </div>
          : <AbstractForm />}
  </Shell>;
}
