'use client';

import Link from 'next/link';
import {type FormEvent, useState} from 'react';

export function RevisionForm({id, request, title, body, hasFile}: {
  id: string; request: string; title: string; body: string; hasFile: boolean
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<{reference: string; receiptEmailAccepted: boolean; organiserEmailAccepted: boolean} | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set('id', id);
    form.set('request', request);
    setBusy(true);
    setMessage('');
    try {
      const result = await fetch('/api/abstracts/revision', {method: 'POST', body: form});
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'The revision could not be submitted.');
      setReceipt(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The revision could not be submitted.');
    } finally {
      setBusy(false);
    }
  }

  if (receipt) return <div className="message success" role="status">
    <strong>Revision submitted for {receipt.reference}.</strong>
    <p>{receipt.receiptEmailAccepted ? 'A confirmation email was sent.' : 'Email delivery could not be confirmed.'}</p>
    {!receipt.organiserEmailAccepted && <p>The revision is visible in the organiser dashboard. The organiser email was not confirmed.</p>}
    <Link href="/dashboard">Return to my portal</Link>
  </div>;

  return <form className="app-form" onSubmit={submit}>
    <label>Abstract title<input name="title" defaultValue={title} minLength={8} maxLength={250} required /></label>
    <label>Revised abstract<textarea name="body" defaultValue={body} rows={9} maxLength={5000} /></label>
    <p className="help">Up to 300 words. You can also submit your abstract as an attachment.</p>
    <label>{hasFile ? 'Replace the existing attachment' : 'Attach your revised abstract'}
      <input name="file" type="file" accept=".pdf,.doc,.docx" />
    </label>
    <p className="help">PDF, DOC or DOCX, up to 2 MB. {hasFile && 'The existing file is kept unless you replace or remove it.'}</p>
    {hasFile && <label className="checkbox-row"><input name="remove_file" type="checkbox" /> Remove the existing attachment</label>}
    <label>Summary of changes (optional)<textarea className="revision-note" name="response" rows={4} maxLength={4000} /></label>
    {message && <p role="alert" className="message error">{message}</p>}
    <button className="app-button" disabled={busy}>{busy ? 'Submitting revision…' : 'Submit revision'}</button>
  </form>;
}
