import {NextRequest, NextResponse} from 'next/server';
import {authorized, error, validText, emailSend} from '@/lib/api';
import {getSupabaseServer} from '@/lib/supabase/server';
import {getConferenceSettings, registrationState, registrationReference} from '@/lib/conference-mode';

const CLOSED_MESSAGE = {
  closed: 'Registration is not open yet.',
  'deadline-passed': 'The registration deadline has passed.',
  unavailable: 'Registration is temporarily unavailable. Please try again shortly.'
} as const;

export async function POST(req: NextRequest) {
  const settings = await getConferenceSettings();
  const state = registrationState(settings);
  if (state !== 'open') return error(CLOSED_MESSAGE[state], state === 'unavailable' ? 503 : 403);

  const a = await authorized();
  if (a.error) return a.error;
  const user = a.user!;

  let d: Record<string, unknown>;
  try { d = await req.json(); } catch { return error('Invalid request.'); }
  if (!validText(d.full_name, 3, 160) || !validText(d.institution, 2, 200) || !validText(d.country, 2, 80))
    return error('Please complete your name, institution and country.');
  if (!['humboldtian', 'non-humboldtian'].includes(String(d.humboldt_status))
    || !['yes', 'no'].includes(String(d.german_fellowship))
    || !['yes', 'no'].includes(String(d.submitting_abstract)))
    return error('Please answer all participation questions.');
  if (d.consent_data !== 'on' && d.consent_data !== true) return error('Consent to data processing is required to register.');
  if (!['student', 'academic', 'professional', 'other'].includes(String(d.category))) return error('Please choose a delegate category.');

  const optional = (v: unknown, max: number) => typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
  const isTest = settings.demo_mode;
  const db = await getSupabaseServer();
  const r = await db.from('registrations').insert({
    user_id: user.id,
    is_demo: isTest,
    full_name: String(d.full_name).trim(),
    email: user.email,
    institution: String(d.institution).trim(),
    country: String(d.country).trim(),
    city: optional(d.city, 100),
    phone: optional(d.phone, 25),
    humboldt_status: d.humboldt_status,
    german_fellowship: d.german_fellowship === 'yes',
    submitting_abstract: d.submitting_abstract === 'yes',
    category: d.category,
    consent_data: true,
    consent_media: d.consent_media === 'on' || d.consent_media === true
  }).select('id,serial_number').single();

  if (r.error) {
    if (r.error.code === '23505') return error('This account is already registered. Open your portal to see your registration.', 409);
    if (r.error.code === '42501') return error('Registration is not open for this account right now.', 403);
    return error('Registration could not be saved. Please try again.', 500);
  }
  const reference = registrationReference(r.data.serial_number, isTest);
  if (user.email) await emailSend(user.email,
    (isTest ? 'Test registration recorded — ' : 'Registration confirmed — ') + reference,
    `<p>Thank you for registering for Akure Humboldt Kolleg 2027 (22–25 February 2027, FUTA, Akure).</p>
     <p>Your registration reference is <strong>${reference}</strong>. Participation is free.</p>` +
    (isTest ? '<p><strong>Pre-launch test record:</strong> this is not an official registration.</p>' : ''));
  if (process.env.ORGANISER_NOTIFICATION_EMAIL) await emailSend(process.env.ORGANISER_NOTIFICATION_EMAIL,
    'New registration — ' + reference, `<p>A new registration was received. Reference: ${reference}</p>`);
  return NextResponse.json({reference, attendance_fee: 0, test_record: isTest}, {status: 201});
}
