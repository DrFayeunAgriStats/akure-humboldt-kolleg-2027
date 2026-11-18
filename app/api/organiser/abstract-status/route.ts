import {NextRequest,NextResponse} from 'next/server';
import {error,emailSend} from '@/lib/api';
import {getSupabaseServer,requireRole} from '@/lib/supabase/server';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statuses=['submitted','under_review','accepted','rejected'];

export async function PATCH(req:NextRequest){
  const user=await requireRole('organiser').catch(()=>null);
  if(!user)return error('Organiser access required.',403);
  let data:{id?:string;status?:string;is_published?:boolean};
  try{data=await req.json()}catch{return error('Invalid JSON.')}
  if(!uuid.test(data.id||'')||!statuses.includes(data.status||'')||typeof data.is_published!=='boolean')
    return error('Invalid decision request.');
  if(data.is_published&&data.status!=='accepted')
    return error('Only accepted abstracts can be published.');
  const db=await getSupabaseServer();
  const {data:previous,error:readError}=await db.from('abstracts')
    .select('id,serial_number,email,status,is_demo,is_published')
    .eq('id',data.id!).maybeSingle();
  if(readError||!previous)return error('Abstract not found or inaccessible.',404);
  if(data.is_published&&previous.is_demo)
    return error('Test records cannot be released publicly.',403);

  if((data.status==='accepted'||data.status==='rejected')&&previous.status!==data.status){
    const assignments=await db.from('review_assignments').select('id').eq('abstract_id',data.id!);
    if(assignments.error)return error('Could not check peer-review records.',500);
    const ids=(assignments.data||[]).map(a=>a.id);
    if(!ids.length)return error('A completed reviewer assessment is required before a scientific decision.',409);
    const reports=await db.from('reviews').select('id').in('assignment_id',ids).limit(1);
    if(reports.error||!reports.data?.length)
      return error('A completed reviewer assessment is required before a scientific decision.',409);
  }
  const r=await db.from('abstracts').update({
    status:data.status,is_published:data.is_published,
    decision_at:['accepted','rejected'].includes(data.status!)?new Date().toISOString():null
  }).eq('id',data.id!).eq('status',previous.status).select('id').maybeSingle();
  if(r.error)return error('Decision could not be saved.',403);
  if(!r.data)return error('The abstract changed. Refresh the dashboard and try again.',409);

  let notified=false;
  if(previous.status!==data.status&&['accepted','rejected'].includes(data.status!)){
    const ref=(previous.is_demo?'DEMO-AKH-ABS-':'AKH-ABS-')+String(previous.serial_number).padStart(4,'0');
    notified=await emailSend(previous.email,
      (previous.is_demo?'Test decision — ':'Abstract decision — ')+ref,
      '<p>The organiser has changed the status of your abstract <strong>'+ref+
      '</strong> to <strong>'+data.status+'</strong>.</p>'+
      '<p>Sign in to your conference dashboard to view your updated submission status.</p>'+
      (previous.is_demo?'<p><strong>Test only:</strong> this is not a formal acceptance or rejection.</p>':''));
  }
  return NextResponse.json({saved:true,notified,notification_required:previous.status!==data.status&&['accepted','rejected'].includes(data.status!)});
}
