import {NextRequest,NextResponse} from 'next/server';
import {error,emailSend} from '@/lib/api';
import {getSupabaseServer,requireRole} from '@/lib/supabase/server';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req:NextRequest){
  const organiser=await requireRole('organiser').catch(()=>null);
  if(!organiser)return error('Organiser access required.',403);
  let d:{abstract_id?:string;reviewer_id?:string};
  try{d=await req.json()}catch{return error('Invalid JSON body.')}
  if(!uuid.test(d.abstract_id||'')||!uuid.test(d.reviewer_id||''))return error('Invalid abstract or reviewer ID.');
  const db=await getSupabaseServer();
  const [role,paper,directory]=await Promise.all([
    db.from('user_roles').select('role').eq('user_id',d.reviewer_id!).eq('role','reviewer').maybeSingle(),
    db.from('abstracts').select('id,user_id,serial_number,status,is_demo,updated_at').eq('id',d.abstract_id!).maybeSingle(),
    db.rpc('conference_reviewer_directory')
  ]);
  if(!role.data)return error('The selected person must be authorised as a reviewer.',403);
  if(!paper.data)return error('Abstract not found.',404);
  if(paper.data.user_id===d.reviewer_id)return error('An author cannot review their own abstract.',409);
  if(!['submitted','under_review'].includes(paper.data.status))return error('Only pending abstracts may be assigned.',409);
  const {error:assignError}=await db.from('review_assignments')
    .upsert({abstract_id:d.abstract_id,reviewer_id:d.reviewer_id},{onConflict:'abstract_id,reviewer_id'});
  if(assignError)return error('Reviewer assignment could not be saved.',500);
  let updatedAt = paper.data.updated_at;
  if(paper.data.status==='submitted'){
    const update=await db.from('abstracts').update({status:'under_review'})
      .eq('id',d.abstract_id!).eq('status','submitted').select('updated_at').maybeSingle();
    if(update.error || !update.data)return error('Assignment saved, but the abstract changed. Refresh the dashboard.',409);
    updatedAt = update.data.updated_at;
  }
  const email=(directory.data||[]).find((r:{user_id:string;user_email:string})=>r.user_id===d.reviewer_id)?.user_email;
  const reference=(paper.data.is_demo?'DEMO-AKH-ABS-':'AKH-ABS-')+String(paper.data.serial_number).padStart(4,'0');
  const notified=email?await emailSend(email,'Review assignment — '+reference,
    '<p>You have been assigned an abstract for peer review: <strong>'+reference+
    '</strong>.</p><p>Access your reviewer workspace through the conference website.</p>'+
    (paper.data.is_demo?'<p><strong>Pre-launch test record:</strong> this is not an official conference assignment.</p>':'')):false;
  return NextResponse.json({assigned:true,notified,updatedAt});
}
