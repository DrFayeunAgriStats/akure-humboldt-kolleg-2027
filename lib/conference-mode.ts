import {cookies} from 'next/headers';
import {cache} from 'react';
import {getSupabaseServer, hasConfig} from '@/lib/supabase/server';

/**
 * Launch controls live in the database (public.conference_settings, row id=1),
 * the same row that the RLS insert policies check. The application reads that
 * row instead of keeping its own flags, so the website and the database cannot
 * disagree about whether registration or abstract submission is open.
 *
 * - registration_open / submissions_open / deadlines: organisers change these
 *   from the organiser dashboard (Launch controls).
 * - demo_mode: true while the platform is in pre-launch testing. Every record
 *   created then is stored with is_demo=true. It is switched off only through
 *   the reviewed transition in docs/LAUNCH_TRANSITION.md, never from the browser.
 */
export type ConferenceSettings = {
  registration_open: boolean;
  submissions_open: boolean;
  registration_deadline: string | null;
  abstract_deadline: string | null;
  demo_mode: boolean;
  updated_at: string | null;
  /** false when the settings could not be read; everything is then treated as closed. */
  available: boolean;
};

const FAIL_CLOSED: ConferenceSettings = {
  registration_open: false,
  submissions_open: false,
  registration_deadline: null,
  abstract_deadline: null,
  demo_mode: true,
  updated_at: null,
  available: false
};

export const getConferenceSettings = cache(async (): Promise<ConferenceSettings> => {
  if (!hasConfig()) return FAIL_CLOSED;
  try {
    const db = await getSupabaseServer();
    const {data, error} = await db
      .from('conference_settings')
      .select('registration_open,submissions_open,registration_deadline,abstract_deadline,demo_mode,updated_at')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return FAIL_CLOSED;
    return {...data, demo_mode: data.demo_mode ?? true, available: true};
  } catch {
    return FAIL_CLOSED;
  }
});

export const LOC_TEST_COOKIE = 'akh_loc_test';

export async function participantTestMode(settings: ConferenceSettings) {
  return settings.demo_mode || (await cookies()).get(LOC_TEST_COOKIE)?.value === '1';
}

export type GateState = 'open' | 'closed' | 'deadline-passed' | 'unavailable';

function gate(open: boolean, deadline: string | null, s: ConferenceSettings): GateState {
  if (!s.available) return 'unavailable';
  if (!open) return 'closed';
  if (deadline && Date.now() >= Date.parse(deadline)) return 'deadline-passed';
  return 'open';
}

export const registrationState = (s: ConferenceSettings) => gate(s.registration_open, s.registration_deadline, s);
export const submissionState = (s: ConferenceSettings) => gate(s.submissions_open, s.abstract_deadline, s);

export {registrationReference, abstractReference, formatDeadline} from './conference-mode-shared';
