import {NextRequest, NextResponse} from 'next/server';
import {error} from '@/lib/api';
import {getSupabaseServer, requireRole} from '@/lib/supabase/server';

/*
 * Reviewer-role administration.
 * The route checks the organiser role, then calls SECURITY DEFINER database
 * functions with the organiser's OWN session. Those functions re-check the role,
 * so no privileged key is used and direct writes to user_roles stay revoked.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noStore = {headers: {'Cache-Control': 'no-store'}};

async function organiser() {
  return requireRole('organiser').catch(() => null);
}

export async function GET() {
  if (!(await organiser())) return error('Organiser access required.', 403);
  const db = await getSupabaseServer();
  const {data, error: queryError} = await db.rpc('conference_reviewer_directory');
  if (queryError) return error('Could not load authorised reviewers.', 500);
  const reviewers = (data || []).map((r: {user_id: string; user_email: string}) => ({id: r.user_id, email: r.user_email}));
  return NextResponse.json({reviewers}, noStore);
}

export async function POST(req: NextRequest) {
  if (!(await organiser())) return error('Organiser access required.', 403);
  let body: {email?: unknown};
  try { body = await req.json(); } catch { return error('Invalid request.'); }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 254) return error('Enter a valid email address.');
  const db = await getSupabaseServer();
  const {data, error: rpcError} = await db.rpc('grant_conference_reviewer', {p_email: email});
  if (rpcError) {
    if (rpcError.code === 'P0002') return error('No account uses that email. Ask the reviewer to sign in to the conference portal once, then try again.', 404);
    if (rpcError.code === '23505') return error('This account is already an authorised reviewer.', 409);
    if (rpcError.code === '42501' && /themselves/.test(rpcError.message)) return error('You cannot grant the reviewer role to your own account.', 409);
    if (rpcError.code === '42501') return error('Organiser access required.', 403);
    return error('Reviewer access could not be granted.', 500);
  }
  const row = (data || [])[0] as {user_id: string; user_email: string} | undefined;
  return NextResponse.json({reviewer: {id: row?.user_id, email: row?.user_email ?? email}}, {status: 201, ...noStore});
}

export async function DELETE(req: NextRequest) {
  if (!(await organiser())) return error('Organiser access required.', 403);
  let body: {user_id?: unknown};
  try { body = await req.json(); } catch { return error('Invalid request.'); }
  if (typeof body.user_id !== 'string' || !UUID.test(body.user_id)) return error('Invalid reviewer.');
  const db = await getSupabaseServer();
  const {data, error: rpcError} = await db.rpc('revoke_conference_reviewer', {p_user_id: body.user_id});
  if (rpcError) return error(rpcError.code === '42501' ? 'Organiser access required.' : 'Reviewer access could not be removed.', rpcError.code === '42501' ? 403 : 500);
  if (!data) return error('That account is not a reviewer.', 404);
  return NextResponse.json({removed: true}, noStore);
}
