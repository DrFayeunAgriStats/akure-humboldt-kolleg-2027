import {NextRequest, NextResponse} from 'next/server';
import {error} from '@/lib/api';
import {getSupabaseServer, requireRole} from '@/lib/supabase/server';

/*
 * Launch controls. Runs with the organiser's own session: RLS
 * (conference_settings_admin_update) and the column grant decide what can change,
 * so demo_mode can never be altered here. updated_at/updated_by are stamped by a
 * database trigger.
 */
type Patch = {registration_open?: boolean; submissions_open?: boolean; registration_deadline?: string | null; abstract_deadline?: string | null};

function deadline(v: unknown): string | null | undefined | false {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string' || Number.isNaN(Date.parse(v))) return false;
  return new Date(v).toISOString();
}

export async function PATCH(req: NextRequest) {
  const user = await requireRole('organiser').catch(() => null);
  if (!user) return error('Organiser access required.', 403);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return error('Invalid request.'); }

  const patch: Patch = {};
  for (const key of ['registration_open', 'submissions_open'] as const) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'boolean') return error('Invalid value for ' + key + '.');
    patch[key] = body[key] as boolean;
  }
  for (const key of ['registration_deadline', 'abstract_deadline'] as const) {
    const d = deadline(body[key]);
    if (d === false) return error('Invalid date for ' + key.replace('_', ' ') + '.');
    if (d !== undefined) patch[key] = d;
  }
  if (!Object.keys(patch).length) return error('Nothing to update.');

  const db = await getSupabaseServer();
  const {data, error: updateError} = await db.from('conference_settings').update(patch).eq('id', 1)
    .select('registration_open,submissions_open,registration_deadline,abstract_deadline,demo_mode,updated_at').maybeSingle();
  if (updateError || !data) return error('Launch settings could not be saved.', updateError?.code === '42501' ? 403 : 500);
  return NextResponse.json({settings: data}, {headers: {'Cache-Control': 'no-store'}});
}
