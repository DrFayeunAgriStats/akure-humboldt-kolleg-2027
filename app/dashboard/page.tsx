import Link from 'next/link';
import {Shell, TestModeNotice} from '@/components/Shell';
import {getSupabaseServer, hasConfig} from '@/lib/supabase/server';
import {SignOut} from './sign-out';
import {getConferenceSettings, registrationReference, abstractReference} from '@/lib/conference-mode';
import {STATUS_LABEL} from '@/lib/labels';

export const metadata = {
  title: 'My portal',
  description: 'Private portal for registered participants and submitting authors at Akure Humboldt Kolleg 2027.',
  alternates: {canonical: '/dashboard'},
  robots: {index: false, follow: false}
};
export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!hasConfig()) return <Shell title="My portal"><div className="message warn">The participant portal is temporarily unavailable.</div></Shell>;
  const db = await getSupabaseServer();
  const {data: {user}} = await db.auth.getUser();
  if (!user) return <Shell title="My portal" kicker="Private account">
    <div className="plain-card cta-card">
      <h2>Sign in to your portal</h2>
      <p>View your registration, submit abstracts and follow their review status.</p>
      <Link className="app-button" href="/login?next=/dashboard">Sign in</Link>
    </div>
  </Shell>;

  const settings = await getConferenceSettings();
  const [{data: reg}, {data: subs}, {data: roles}] = await Promise.all([
    db.from('registrations').select('serial_number,full_name,is_demo').eq('user_id', user.id).eq('is_demo', settings.demo_mode).maybeSingle(),
    db.from('abstracts').select('id,serial_number,title,track,status,is_demo').eq('user_id', user.id).order('created_at', {ascending: false}),
    db.from('user_roles').select('role').eq('user_id', user.id)
  ]);
  const isOrganiser = roles?.some(x => x.role === 'organiser');
  const isReviewer = roles?.some(x => x.role === 'reviewer');

  return <Shell title="My portal" kicker="Private account" intro="Your registration, abstracts and their review status in one place." wide notice={<TestModeNotice show={settings.demo_mode} />}>
    <div className="app-topbar"><span>Signed in as <strong>{user.email}</strong></span><SignOut /></div>

    {(isOrganiser || isReviewer) && <nav className="staff-links" aria-label="Staff workspaces">
      {isReviewer && <Link className="app-button app-btn-secondary" href="/dashboard/reviewer">Reviewer workspace →</Link>}
      {isOrganiser && <Link className="app-button app-btn-secondary" href="/dashboard/organiser">Organiser control centre →</Link>}
    </nav>}

    <div className="app-grid">
      <section className="plain-card" aria-labelledby="card-reg">
        <span className="eyebrow-small">REGISTRATION</span>
        <h2 id="card-reg">{reg ? registrationReference(reg.serial_number, reg.is_demo) : 'Not registered'}</h2>
        <p>{reg ? reg.full_name : 'Registration is free and required before submitting an abstract.'}</p>
        <Link href="/register" className={reg ? '' : 'app-button'}>{reg ? 'View registration details' : 'Register now'}</Link>
      </section>
      <section className="plain-card" aria-labelledby="card-abs">
        <span className="eyebrow-small">ABSTRACTS</span>
        <h2 id="card-abs">{subs?.length || 0} submitted</h2>
        <p>Abstracts of 250–300 words under one of the five sub-themes.</p>
        <Link href="/submit">{reg ? 'Submit an abstract' : 'Call for abstracts'}</Link>
      </section>
      <section className="plain-card" aria-labelledby="card-fee">
        <span className="eyebrow-small">PARTICIPATION</span>
        <h2 id="card-fee">Free</h2>
        <p>The Kolleg is fully sponsored. No fees or payment are required.</p>
      </section>
    </div>

    <section className="plain-card" aria-labelledby="my-abstracts">
      <h2 id="my-abstracts">My abstracts</h2>
      {subs?.length
        ? <div className="app-table-scroll" role="region" aria-label="My abstracts table" tabIndex={0}>
            <table className="styled-table">
              <thead><tr><th scope="col">Reference</th><th scope="col">Title</th><th scope="col">Sub-theme</th><th scope="col">Status</th></tr></thead>
              <tbody>{subs.map(a => <tr key={a.id}>
                <td>{abstractReference(a.serial_number, a.is_demo)}</td>
                <td>{a.title}</td>
                <td>Sub-theme {a.track}</td>
                <td><span className={'status-pill status-' + a.status}>{STATUS_LABEL[a.status] || a.status}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
        : <p>You have not submitted an abstract yet. {reg && <Link href="/submit">Submit one now</Link>}</p>}
    </section>
  </Shell>;
}
