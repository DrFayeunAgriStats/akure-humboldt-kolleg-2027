'use client';
import {useState, FormEvent} from 'react';
import Link from 'next/link';
import {THEMES} from '@/lib/themes';

const countWords = (s: string) => s.trim() ? s.trim().split(/\s+/u).length : 0;

export function AbstractForm() {
  const [body, setBody] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const words = countWords(body);
  const withinLimit = words >= 250 && words <= 300;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!withinLimit) {
      const msg = `Your abstract must be 250–300 words. It currently has ${words}.`;
      setError(msg); return;
    }
    const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement | null)?.files?.[0];
    if (file && file.size > 2 * 1024 * 1024) {
      const msg = 'The attachment is larger than 2 MB.'; setError(msg); return;
    }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/abstracts', {method: 'POST', body: new FormData(e.currentTarget)});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Submission failed. Please try again.');
      setReference(data.reference);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      setError(msg);
    } finally { setBusy(false); }
  }

  if (reference) return <div className="message success" role="status">
    <strong>Abstract received.</strong> Your reference is <strong>{reference}</strong>. You will be notified by email when a decision is made; you can follow its status in your portal.
    <div className="action-row">
      <Link className="app-button" href="/dashboard">Go to my portal</Link>
      <button type="button" className="app-button app-btn-secondary" onClick={() => { setReference(''); setBody(''); }}>Submit another abstract</button>
    </div>
  </div>;

  return <form className="app-form" onSubmit={submit}>
    <fieldset>
      <legend>Abstract details</legend>
      <label>Title<input name="title" required minLength={8} maxLength={250} /></label>
      <label>Sub-theme<select name="track" required defaultValue=""><option value="" disabled>Choose a sub-theme</option>{THEMES.map((t, i) => <option key={i} value={i + 1}>{i + 1}. {t}</option>)}</select></label>
      <label>Presentation preference<select name="presentation_type" required defaultValue="oral"><option value="oral">Oral presentation</option><option value="poster">Poster</option></select></label>
      <label>Keywords <span className="optional">(comma-separated)</span><input name="keywords" required maxLength={250} placeholder="e.g. agroforestry, soil carbon, resilience" /></label>
    </fieldset>
    <fieldset>
      <legend>Authors</legend>
      <label>Presenting / corresponding author<input name="author_name" required minLength={3} maxLength={160} autoComplete="name" /></label>
      <label>Institution<input name="institution" required minLength={2} maxLength={200} autoComplete="organization" /></label>
      <label>Co-authors <span className="optional">(optional, separate with semicolons)</span><input name="co_authors" maxLength={500} /></label>
    </fieldset>
    <fieldset>
      <legend>Abstract text</legend>
      <label>Abstract (250–300 words)
        <textarea required name="body" rows={12} value={body} onChange={e => setBody(e.target.value)} aria-describedby="word-count" />
      </label>
      <p id="word-count" aria-live="polite" className={'word-count ' + (withinLimit ? 'is-ok' : words > 300 ? 'is-over' : '')}>
        <strong>{words}</strong> / 250–300 words · {words < 250 ? `${250 - words} more needed` : words > 300 ? `${words - 300} over the limit` : 'within the limit'}
      </p>
      <label>Attachment <span className="optional">(optional · PDF, DOC or DOCX · max 2 MB)</span><input name="file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></label>
    </fieldset>
    <button disabled={busy}>{busy ? 'Submitting…' : 'Submit abstract'}</button>
    <p className="field-help">Submission does not guarantee acceptance. Abstracts are published only after acceptance and approval.</p>
    {error && <div role="alert" className="message error">{error}</div>}
  </form>;
}
