import {NextRequest, NextResponse} from 'next/server';
import {authorized, error, validText, wordCount, emailSend, escapeHtml} from '@/lib/api';
import {uploadAbstractFile} from '@/lib/abstract-file';
import {getSupabaseServer} from '@/lib/supabase/server';
import {participantTestMode, getConferenceSettings, submissionState, abstractReference} from '@/lib/conference-mode';

const CLOSED_MESSAGE = {
  closed: 'Abstract submission is not open yet.',
  'deadline-passed': 'The abstract submission deadline has passed.',
  unavailable: 'Abstract submission is temporarily unavailable. Please try again shortly.'
} as const;

export async function POST(req: NextRequest) {
  const settings = await getConferenceSettings();
  const testing = await participantTestMode(settings);
  const state = submissionState(settings);
  if (state !== 'open') return error(CLOSED_MESSAGE[state], state === 'unavailable' ? 503 : 403);

  const a = await authorized();
  if (a.error) return a.error;
  const user = a.user!;

  let f: FormData;
  try { f = await req.formData(); } catch { return error('Invalid form submission.'); }
  const title = f.get('title'), author = f.get('author_name'), institution = f.get('institution');
  const bodyField = f.get('body'), keywords = f.get('keywords'), coAuthors = f.get('co_authors');
  const body = typeof bodyField === 'string' ? bodyField.trim() : '';
  const file = f.get('file');
  const hasFile = file instanceof File && file.size > 0;
  const track = Number(f.get('track')), presentation = String(f.get('presentation_type'));
  if (!validText(title, 8, 250) || !validText(author, 3, 160) || !validText(institution, 2, 200) || (!validText(keywords, 2, 250) || !String(keywords).split(',').some(word => word.trim())))
    return error('Please complete the title, author, institution and keywords.');
  if (!body && !hasFile) return error('Enter abstract text or upload an abstract file.');
  if (body.length > 5000 || wordCount(body) > 300)
    return error('The abstract must not exceed 300 words or 5000 characters.');
  if (!Number.isInteger(track) || track < 1 || track > 5) return error('Please choose one of the five sub-themes.');
  if (presentation !== 'oral' && presentation !== 'poster') return error('Please choose oral or poster presentation.');

  const isTest = testing;
  const db = await getSupabaseServer();
  const reg = await db.from('registrations').select('id').eq('user_id', user.id).eq('is_demo', isTest).maybeSingle();
  if (!reg.data) return error('Please register for the Kolleg before submitting an abstract.', 403);

  let path: string | null = null;
  if (file instanceof File && file.size) {
    const upload = await uploadAbstractFile(db, user.id, file);
    if (upload.error !== undefined) return error(upload.error, upload.status);
    path = upload.path;
  }

  const insertion = await db.from('abstracts').insert({
    user_id: user.id,
    is_demo: isTest,
    registration_id: reg.data.id,
    author_name: String(author).trim(),
    email: user.email,
    institution: String(institution).trim(),
    title: String(title).trim(),
    body,
    co_authors: typeof coAuthors === 'string' ? coAuthors.trim().slice(0, 500) : '',
    track,
    presentation_type: presentation,
    keywords: String(keywords).split(',').map(k => k.trim()).filter(Boolean).slice(0, 12),
    file_path: path,
    status: 'submitted'
  }).select('serial_number').single();
  if (insertion.error) {
    if (path) await db.storage.from('abstract-files').remove([path]);
    return error('Your abstract could not be saved. Please try again.', 500);
  }

  const reference = abstractReference(insertion.data.serial_number, isTest);
  const receiptEmailAccepted = Boolean(user.email) && await emailSend(user.email!,
    (isTest ? 'Test abstract recorded — ' : 'Abstract received — ') + reference,
    `<p>Your abstract "${escapeHtml(String(title).trim())}" has been received. Reference: <strong>${reference}</strong>.</p>` +
    (isTest ? '<p><strong>Pre-launch test record:</strong> this is not an official submission.</p>'
            : '<p>It will now be screened and peer reviewed. You can follow its status in your conference portal.</p>'));
  return NextResponse.json({reference, receiptEmailAccepted, status: 'submitted', test_record: isTest}, {status: 201});
}
