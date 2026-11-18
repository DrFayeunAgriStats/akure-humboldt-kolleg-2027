import {createClient} from '@supabase/supabase-js';
import {SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY} from './supabase/public-config';
import type {ConferenceSettings} from './conference-mode';
import {formatDeadline} from './conference-mode-shared';

const FAIL_CLOSED: ConferenceSettings = {
  registration_open: false, submissions_open: false, registration_deadline: null, abstract_deadline: null,
  demo_mode: true, updated_at: null, available: false
};

/**
 * Launch settings for PUBLIC pages (the homepage), read without a user session so the
 * page can be statically cached and revalidated. conference_settings is world-readable
 * by design (anon SELECT). Any failure is treated as "closed".
 */
export async function getPublicConferenceSettings(): Promise<ConferenceSettings> {
  if (!SUPABASE_PUBLIC_URL || !SUPABASE_PUBLIC_KEY) return FAIL_CLOSED;
  try {
    const db = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY, {auth: {persistSession: false, autoRefreshToken: false}});
    const {data, error} = await db.from('conference_settings')
      .select('registration_open,submissions_open,registration_deadline,abstract_deadline,demo_mode,updated_at')
      .eq('id', 1).maybeSingle();
    if (error || !data) return FAIL_CLOSED;
    return {...data, demo_mode: data.demo_mode ?? true, available: true};
  } catch {
    return FAIL_CLOSED;
  }
}

export type PublicStatus = {
  /** True only for OFFICIAL registration (not pre-launch test mode). */
  registrationOfficiallyOpen: boolean;
  registration: string;
  abstracts: string;
};

function describe(open: boolean, deadline: string | null, s: ConferenceSettings, what: 'registration' | 'the call for abstracts'): string {
  if (!s.available) return 'Status currently unavailable — see the page for details';
  if (s.demo_mode) return what === 'registration' ? 'Opens soon — official registration will be announced here' : 'Opens soon — the call will be announced here';
  if (!open) return 'Not yet open';
  if (deadline && Date.now() >= Date.parse(deadline)) return 'Closed';
  return deadline ? `Open until ${formatDeadline(deadline)}` : 'Open';
}

/** Accurate, public-facing wording for the homepage. Never presents test mode as official. */
export function publicStatus(s: ConferenceSettings): PublicStatus {
  const regOpen = s.available && !s.demo_mode && s.registration_open
    && !(s.registration_deadline && Date.now() >= Date.parse(s.registration_deadline));
  return {
    registrationOfficiallyOpen: regOpen,
    registration: describe(s.registration_open, s.registration_deadline, s, 'registration'),
    abstracts: describe(s.submissions_open, s.abstract_deadline, s, 'the call for abstracts')
  };
}
