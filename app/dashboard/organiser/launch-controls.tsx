'use client';
import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useToast} from '@/components/ToastProvider';
import {formatDeadline} from '@/lib/conference-mode-shared';

type Settings = {
  registration_open: boolean;
  submissions_open: boolean;
  registration_deadline: string | null;
  abstract_deadline: string | null;
  demo_mode: boolean;
  updated_at: string | null;
};

// <input type="datetime-local"> values are interpreted as West Africa Time (UTC+1, no DST).
const toWAT = (iso: string | null) => iso
  ? new Intl.DateTimeFormat('sv-SE', {timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'})
      .format(new Date(iso)).replace(' ', 'T')
  : '';
const fromWAT = (v: string) => v ? new Date(v + ':00+01:00').toISOString() : null;

export function LaunchControls({initial}: {initial: Settings}) {
  const [s, setS] = useState(initial);
  const [regDeadline, setRegDeadline] = useState(toWAT(initial.registration_deadline));
  const [absDeadline, setAbsDeadline] = useState(toWAT(initial.abstract_deadline));
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function save(patch: Partial<Settings>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/organiser/settings', {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(patch)});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save launch settings.');
      setS(data.settings);
      toast('Launch settings saved.', 'success');
      router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not save launch settings.', 'error'); }
    finally { setBusy(false); }
  }

  function saveDeadlines(e: FormEvent) {
    e.preventDefault();
    void save({registration_deadline: fromWAT(regDeadline), abstract_deadline: fromWAT(absDeadline)});
  }

  const mode = s.demo_mode ? 'pre-launch test records' : 'official records';
  return <section className="plain-card launch-controls" aria-labelledby="launch-heading">
    <h2 id="launch-heading">Launch controls</h2>
    <p className="help">These switches control the public website and are enforced by the database. New entries are stored as <strong>{mode}</strong>.</p>
    <div className="launch-grid">
      {([
        ['registration_open', 'Registration', s.registration_open],
        ['submissions_open', 'Abstract submission', s.submissions_open]
      ] as const).map(([key, label, isOpen]) => <div className="launch-switch" key={key}>
        <div>
          <span className="eyebrow-small">{label.toUpperCase()}</span>
          <p className={'launch-state ' + (isOpen ? 'is-open' : 'is-closed')}>{isOpen ? 'Open' : 'Closed'}</p>
        </div>
        <button type="button" className={'app-button' + (isOpen ? ' app-btn-secondary' : '')} disabled={busy}
          onClick={() => void save({[key]: !isOpen}, isOpen
            ? `Close ${label.toLowerCase()}? Participants will no longer be able to submit.`
            : `Open ${label.toLowerCase()}? New entries will be stored as ${mode}.`)}>
          {isOpen ? 'Close' : 'Open'} {label.toLowerCase()}
        </button>
      </div>)}
    </div>
    <form className="app-inline-form launch-deadlines" onSubmit={saveDeadlines}>
      <label>Registration deadline (WAT)<input type="datetime-local" value={regDeadline} onChange={e => setRegDeadline(e.target.value)} /></label>
      <label>Abstract deadline (WAT)<input type="datetime-local" value={absDeadline} onChange={e => setAbsDeadline(e.target.value)} /></label>
      <button className="app-button app-btn-secondary" disabled={busy}>Save deadlines</button>
    </form>
    <p className="help">
      {s.registration_deadline ? 'Registration closes ' + formatDeadline(s.registration_deadline) + '. ' : 'No registration deadline set. '}
      {s.abstract_deadline ? 'Abstracts close ' + formatDeadline(s.abstract_deadline) + '. ' : 'No abstract deadline set. '}
      Leave a deadline empty for none.
    </p>
    {s.demo_mode && (s.registration_open || s.submissions_open) && <div className="message warn" role="note">
      <strong>Public test entries are being accepted.</strong> While test mode is on, anyone visiting the public site can create
      test registrations or abstracts. Recommended until the official launch: close registration and abstract submission here.
      The public pages then say they have not opened yet; existing test records are kept.</div>}
    {s.demo_mode && <div className="message warn" role="note"><strong>Pre-launch test mode is on.</strong> Switching to official records is a reviewed database step
      (see LAUNCH_TRANSITION.md in the project repository) and cannot be done from this page.</div>}
  </section>;
}
