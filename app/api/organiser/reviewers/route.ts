import {NextResponse} from 'next/server';
import {error} from '@/lib/api';
import {getSupabaseServer,requireRole} from '@/lib/supabase/server';

export async function GET(){
  const user=await requireRole('organiser').catch(()=>null);
  if(!user)return error('Organiser access required.',403);
  const db=await getSupabaseServer();
  const {data,error:queryError}=await db.rpc('conference_reviewer_directory');
  if(queryError)return error('Could not load authorised reviewers.',500);
  const reviewers=(data||[]).map((r:{user_id:string;user_email:string})=>({id:r.user_id,email:r.user_email}));
  return NextResponse.json({reviewers},{headers:{'Cache-Control':'no-store'}});
}
