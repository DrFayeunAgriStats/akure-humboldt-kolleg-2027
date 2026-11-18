import {NextRequest, NextResponse} from 'next/server';
import {authorized, error, validText, wordCount, emailSend} from '@/lib/api';
import {getSupabaseServer} from '@/lib/supabase/server';
import {getConferenceSettings, submissionState, abstractReference} from '@/lib/conference-mode';

const MAX_BYTES = 2 * 1024 * 1024;
const MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
} as const;
type Ext = keyof typeof MIME;

/** Check the file's leading bytes, not just its name. */
function signatureMatches(ext: Ext, b: Uint8Array) {
  if (ext === 'pdf') return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  if (ext === 'docx') return b[0] === 0x50 && b[1] === 0x4b;                                   // PK (zip)
  return b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;                    // OLE2
}

const CLOSED_MESSAGE = {
  closed: 'Abstract submission is not open yet.',
  'deadline-passed': 'The abstract submission deadline has passed.',
  unavailable: 'Abstract submission is temporarily unavailable. Please try again shortly.'
} as const;

export async function POST(req: NextRequest) {
  const settings = await getConferenceSettings();
  const state = submissionState(settings);
  if (state !== 'open') return error(CLOSED_MESSAGE[state], state === 'unavailable' ? 503 : 403);

  const a = await authorized();
  if (a.error) return a.error;
  const user = a.user!;

  let f: FormData;
  try { f = await req.formData(); } catch { return error('Invalid form submission.'); }
  const title = f.get('title'), author = f.get('author_name'), institution = f.get('institution');
  const body = f.get('body'), keywords = f.get('keywords'), coAuthors = f.get('co_authors');
  const track = Number(f.get('track')), presentation = String(f.get('presentation_type'));
  if (!validText(title, 8, 250) || !validText(author, 3, 160) || !validText(institution, 2, 200) || !validText(keywords, 2, 250))
    return error('Please complete the title, author, institution and keywords.');
  if (!validText(body, 20, 5000) || wordCount(String(body)) < 250 || wordCount(String(body)) > 300)
    return error('The abstract must be 250–300 words.');
  if (!Number.isInteger(track) || track < 1 || track > 5) return error('Please choose one of the five sub-themes.');
  if (presentation !== 'oral' && presentation !== 'poster') return error('Please choose oral or poster presentation.');

  const isTest = settings.demo_mode;
  const db = await getSupabaseServer();
  const reg = await db.from('registrations').select('id').eq('user_id', user.id).eq('is_demo', isTest).maybeSingle();
  if (!reg.data) return error('Please register for the Kolleg before submitting an abstract.', 403);

  let path: string | null = null;
  const file = f.get('file');
  if (file instanceof File && file.size) {
    if (file.size > MAX_BYTES) return error('The attachment exceeds 2 MB.');
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!(ext in MIME)) return error('Only PDF, DOC and DOCX attachments are accepted.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!signatureMatches(ext as Ext, bytes)) return error('The attachment does not appear to be a valid ' + ext.toUpperCase() + ' file.');
    path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const upload = await db.storage.from('abstract-files').upload(path, bytes, {contentType: MIME[ext as Ext], upsert: false});
    if (upload.error) return error('Your attachment could not be uploaded. Please try again.', 500);
  }

  const insertion = await db.from('abstracts').insert({
    user_id: user.id,
    is_demo: isTest,
    registration_id: reg.data.id,
    author_name: String(author).trim(),
    email: user.email,
    institution: String(institution).trim(),
    title: String(title).trim(),
    body: String(body).trim(),
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
  if (user.email) await emailSend(user.email,
    (isTest ? 'Test abstract recorded — ' : 'Abstract received — ') + reference,
    `<p>Your abstract "${escapeHtml(String(title).trim())}" has been received. Reference: <strong>${reference}</strong>.</p>` +
    (isTest ? '<p><strong>Pre-launch test record:</strong> this is not an official submission.</p>'
            : '<p>It will now be screened and peer reviewed. You can follow its status in your conference portal.</p>'));
  return NextResponse.json({reference, status: 'submitted', test_record: isTest}, {status: 201});
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
}
