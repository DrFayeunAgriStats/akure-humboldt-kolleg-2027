import {NextRequest, NextResponse} from 'next/server';
import {authorized, emailSend, error, escapeHtml, validText, wordCount} from '@/lib/api';
import {uploadAbstractFile} from '@/lib/abstract-file';
import {abstractReference} from '@/lib/conference-mode-shared';
import {revisionUuid, todayInLagos} from '@/lib/revisions';
import {CONTACT} from '@/lib/site-content';
import {getSupabaseServer} from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const auth = await authorized();
  if (auth.error) return auth.error;
  const user = auth.user!;
  let form: FormData;
  try { form = await req.formData(); } catch { return error('Invalid revision submission.'); }

  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === 'string' ? value.trim() : '';
  };
  const id = field('id'), request = field('request'), title = field('title');
  const body = field('body'), response = field('response');
  if (!revisionUuid.test(id) || !revisionUuid.test(request)) return error('Invalid revision reference.');
  if (!validText(title, 8, 250)) return error('Enter an abstract title of 8–250 characters.');
  if (body.length > 5000 || wordCount(body) > 300) return error('The abstract must not exceed 300 words or 5000 characters.');
  if (response.length > 4000) return error('Keep your response within 4000 characters.');

  const db = await getSupabaseServer();
  const record = await db.from('abstracts')
    .select('serial_number,is_demo,status,revision_request_id,revision_due_on,file_path,email')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  if (record.error) return error('The abstract could not be loaded.', 500);
  const paper = record.data;
  if (!paper) return error('Abstract not found.', 404);
  if (paper.status !== 'revision_requested' || paper.revision_request_id !== request) {
    return error('The revision request has changed. Refresh the page before submitting.', 409);
  }
  if (paper.revision_due_on && paper.revision_due_on < todayInLagos()) {
    return error('The revision deadline has passed. Contact the conference secretariat.', 409);
  }

  const file = form.get('file');
  const replacement = file instanceof File && file.size > 0 ? file : null;
  const removeExisting = field('remove_file') === 'on';
  if (replacement && removeExisting) return error('Choose either to replace the attachment or to remove it.');
  if (!body && !replacement && (!paper.file_path || removeExisting)) return error('Enter the revised abstract or provide an attachment.');

  let path = null;
  if (replacement) {
    const upload = await uploadAbstractFile(db, `${user.id}/${id}/${request}`, replacement);
    if (upload.error !== undefined) return error(upload.error, upload.status);
    path = upload.path;
  }
  const saved = await db.rpc('submit_abstract_revision', {
    p_id: id, p_request: request, p_title: title, p_body: body, p_response: response,
    p_file_path: path, p_remove_file: removeExisting
  });
  if (saved.error) return error('The revision could not be saved. Please try again.', 500);
  if (!saved.data) return error('The revision could not be saved. Refresh and check the current request and deadline.', 409);

  const ref = abstractReference(paper.serial_number, paper.is_demo);
  const subject = (paper.is_demo ? 'Test: ' : '') + 'Revised abstract received — ' + ref;
  const detail = `“${escapeHtml(title)}” (<strong>${ref}</strong>)`;
  const [receipt, organiser] = await Promise.allSettled([
    emailSend(paper.email, subject,
      `<p>We received your revised abstract ${detail}. It is back with the organising committee for review.</p>`),
    emailSend(process.env.ORGANISER_NOTIFICATION_EMAIL || CONTACT.secretariatEmail, subject,
      `<p>A revision of ${detail} was submitted. <a href="https://futahumboldtkolleg.org/dashboard/organiser">Open the organiser dashboard</a> to review it.</p>`)
  ]);
  return NextResponse.json({
    reference: ref,
    receiptEmailAccepted: receipt.status === 'fulfilled' && receipt.value,
    organiserEmailAccepted: organiser.status === 'fulfilled' && organiser.value
  });
}
