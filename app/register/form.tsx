'use client';
import {useState, FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

export function RegisterForm() {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget).entries());
      const res = await fetch('/api/register', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Registration could not be saved. Please try again.');
      setReference(data.reference);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally { setBusy(false); }
  }

  if (reference) return <div className="message success" role="status">
    <strong>You are registered.</strong> Your reference is <strong>{reference}</strong>. A confirmation has been sent to your email.
    <div className="action-row"><Link className="app-button" href="/submit">Submit an abstract</Link><Link className="app-button app-btn-secondary" href="/dashboard">Go to my portal</Link></div>
  </div>;

  return <form className="app-form" onSubmit={submit}>
    <fieldset>
      <legend>About you</legend>
      <label>Full name<input name="full_name" required minLength={3} maxLength={160} autoComplete="name" /></label>
      <label>Institution or organisation<input name="institution" required minLength={2} maxLength={200} autoComplete="organization" /></label>
      <div className="field-pair">
        <label>Country<input name="country" required minLength={2} maxLength={80} defaultValue="Nigeria" autoComplete="country-name" /></label>
        <label>City <span className="optional">(optional)</span><input name="city" maxLength={100} autoComplete="address-level2" /></label>
      </div>
      <label>Phone <span className="optional">(optional)</span><input name="phone" type="tel" maxLength={25} autoComplete="tel" /></label>
    </fieldset>
    <fieldset>
      <legend>Your participation</legend>
      <label>Delegate category<select name="category" required defaultValue=""><option value="" disabled>Select</option><option value="student">Student</option><option value="academic">Researcher / academic</option><option value="professional">Professional / practitioner</option><option value="other">Other</option></select></label>
      <label>Humboldt status<select name="humboldt_status" required defaultValue=""><option value="" disabled>Select</option><option value="humboldtian">Humboldtian (Humboldt Foundation alumnus/alumna)</option><option value="non-humboldtian">Not a Humboldtian</option></select></label>
      <label>Have you held a German research fellowship?<select name="german_fellowship" required defaultValue=""><option value="" disabled>Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      <label>Do you plan to submit an abstract?<select name="submitting_abstract" required defaultValue=""><option value="" disabled>Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>
    </fieldset>
    <fieldset>
      <legend>Consent</legend>
      <label className="checkbox-row"><input type="checkbox" name="consent_data" required /> <span>I agree to my information being processed as described in the <Link href="/privacy" target="_blank">privacy notice</Link>. <span className="optional">(required)</span></span></label>
      <label className="checkbox-row"><input type="checkbox" name="consent_media" /> <span>I consent to photographs or video of me being used in conference communications. <span className="optional">(optional)</span></span></label>
    </fieldset>
    <button disabled={busy}>{busy ? 'Submitting…' : 'Complete registration'}</button>
    {error && <div role="alert" className="message error">{error}</div>}
  </form>;
}
