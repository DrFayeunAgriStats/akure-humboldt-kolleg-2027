import {Shell} from '@/components/Shell';
import {getSupabaseServer,hasConfig} from '@/lib/supabase/server';
import {Schedule} from './schedule';
import {DraftProgramme} from './draft';
import {BID_DEMO_MODE} from '@/lib/conference-mode';

export const metadata={
 title:'Programme',
 description:'Proposed scientific programme for Akure Humboldt Kolleg 2027, 22–25 February at FUTA.'
};
export const dynamic='force-dynamic';

export default async function Page(){
  let sessions:any[]=[];
  if(hasConfig()){
    const db=await getSupabaseServer();
    const r=await db.from('sessions')
      .select('id,title,description,starts_at,ends_at,session_type,room').eq('published',true).order('starts_at');
    sessions=r.data||[];
  }
  return <Shell title="Scientific programme" kicker="22–25 FEBRUARY 2027">
    <p>Federal University of Technology, Akure · All times in West Africa Time (WAT). The detailed scientific programme is subject to approval by the organising committee.</p>
    {BID_DEMO_MODE&&<div className="message warn"><strong>Functional bid demonstration.</strong> Programme entries displayed here are part of the platform evaluation and must not be understood as official invitations or confirmed commitments.</div>}
    {sessions.length?<Schedule sessions={sessions}/>:<DraftProgramme/>}
  </Shell>;
}
