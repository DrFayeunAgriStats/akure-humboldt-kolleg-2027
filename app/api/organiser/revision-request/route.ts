import {NextRequest, NextResponse} from 'next/server';
import {emailSend, error, escapeHtml, validText} from '@/lib/api';
import {abstractReference} from '@/lib/conference-mode-shared';
import {revisionDeadlineLabel, revisionUuid, todayInLagos} from '@/lib/revisions';
import {getSupabaseServer, requireRole} from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (!await requireRole('organiser').catch(() => null)) return error('Organiser access required.', 403);

  let data;
  try { data = await req.json(); } catch { return error('Invalid JSON.'); }
  if (!data || typeof data.id !== 'string' || !revisionUuid.test(data.id) || !validText(data.instructions, 1, 4000)) {
    return error('Enter the corrections the author should make.');
  }
  const instructions = String(data.instructions).trim();
  const due = data.due || null;
  if (due !== null && (
    typeof due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due) || due < todayInLagos()
    || !Number.isFinite(Date.parse(due)) || new Date(due).toISOString().slice(0, 10) !== due
  )) return error('Choose today or a future date for the revision deadline.');

  const db = await getSupabaseServer();
  const paper = await db.from('abstracts').select('id,status,updated_at,serial_number,is_demo,title,author_name,email')
    .eq('id', data.id).maybeSingle();
  if (!paper.data) return error('Abstract not found or inaccessible.', 404);
  if (!['submitted', 'under_review', 'revision_requested'].includes(paper.data.status)) {
    return error('Corrections can only be requested for a pending abstract.', 409);
  }
  if (paper.data.updated_at !== data.version) return error('The abstract changed. Refresh before sending the request.', 409);

  const saved = await db.from('abstracts').update({
    status: 'revision_requested',
    revision_request_id: crypto.randomUUID(),
    revision_instructions: instructions,
    revision_due_on: due,
    is_published: false,
    decision_at: null
  }).eq('id', data.id).eq('updated_at', paper.data.updated_at).select('updated_at').maybeSingle();
  if (saved.error) return error('The revision request could not be saved.', 500);
  if (!saved.data) return error('The abstract changed. Refresh before sending the request.', 409);

  const ref = abstractReference(paper.data.serial_number, paper.data.is_demo);
  const url = 'https://futahumboldtkolleg.org/dashboard/abstracts/' + paper.data.id + '/revise';
  const notified = await emailSend(paper.data.email, (paper.data.is_demo ? 'Test: ' : '') + 'Abstract corrections requested — ' + ref,
    `<p>Dear ${escapeHtml(paper.data.author_name)},</p>` +
    `<p>The organising committee requests corrections to “${escapeHtml(paper.data.title)}” (<strong>${ref}</strong>).</p>` +
    `<p><strong>Requested corrections</strong><br>${escapeHtml(instructions).replace(/\r?\n/g, '<br>')}</p>` +
    (due ? `<p>Please submit the revision by ${revisionDeadlineLabel(due)} (West Africa Time).</p>` : '') +
    `<p><a href="${url}">Submit your revision in the conference portal</a>.</p>` +
    (paper.data.is_demo ? '<p>This message is for a test submission.</p>' : '')).catch(() => false);

  return NextResponse.json({notified, updatedAt: saved.data.updated_at});
}
