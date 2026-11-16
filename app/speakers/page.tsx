import {Shell} from '@/components/Shell';
import {getSupabaseServer,hasConfig} from '@/lib/supabase/server';
import {BID_DEMO_MODE} from '@/lib/conference-mode';

export const metadata={title:'Speakers',description:'Proposed Akure Humboldt Kolleg 2027 scientific speakers and programme.'};
export const dynamic='force-dynamic';
export default async function Page(){
  let speakers:any[]=[];
  if(hasConfig()){
    const db=await getSupabaseServer();
    const r=await db.from('speakers')
      .select('id,name,institution,short_bio,talk_title,photo_url').eq('published',true).order('sort_order').order('name');
    speakers=r.data||[];
  }
  return <Shell title="Scientific speakers" kicker="PROPOSED PROGRAMME">
    {BID_DEMO_MODE&&<div className="message warn"><strong>Website demonstration:</strong> speaker details will become official only after confirmation by the organising committee.</div>}
    {speakers.length?<div className="app-grid">{speakers.map(s=><article key={s.id} className="plain-card">
      {s.photo_url?<img src={s.photo_url} alt={'Photograph of '+s.name} width={250} height={190}/>:null}
      <h3>{s.name}</h3><p>{s.institution}</p><strong>{s.talk_title}</strong><p>{s.short_bio}</p>
    </article>)}</div>:<div className="message">No keynote speakers have been publicly confirmed on the demonstration platform. Speaker profiles can be added, edited and published through the authenticated organiser dashboard.</div>}
  </Shell>;
}
