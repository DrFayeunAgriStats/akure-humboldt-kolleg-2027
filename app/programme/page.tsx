import {Shell} from '@/components/Shell';
import {getSupabaseServer,hasConfig} from '@/lib/supabase/server';
import {Schedule} from './schedule';
import {DraftProgramme} from './draft';

export const metadata={
 title:'Programme',
 description:'Scientific programme for Akure Humboldt Kolleg 2027, 15–18 March 2027 at FUTA, Akure.',
 alternates:{canonical:'/programme'}
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
  return <Shell title="Programme" kicker="15–18 March 2027 · FUTA, Akure" intro="Monday 15 March is for arrival and the pre-conference workshop on grant writing. The three conference days run from Tuesday 16 to Thursday 18 March." wide>
    <p>Federal University of Technology, Akure · All times in West Africa Time (WAT). The detailed scientific programme is subject to approval by the organising committee.</p>
    {sessions.length?<Schedule sessions={sessions}/>:<DraftProgramme/>}
  </Shell>;
}
