import {Shell} from '@/components/Shell';
import {getSupabaseServer,hasConfig} from '@/lib/supabase/server';

export const metadata={title:'Speakers',description:'Keynote and invited speakers at Akure Humboldt Kolleg 2027, FUTA, Akure, 22–25 February 2027.',alternates:{canonical:'/speakers'}};
export const dynamic='force-dynamic';
export default async function Page(){
  let speakers:any[]=[];
  if(hasConfig()){
    const db=await getSupabaseServer();
    const r=await db.from('speakers')
      .select('id,name,institution,short_bio,talk_title,photo_url').eq('published',true).order('sort_order').order('name');
    speakers=r.data||[];
  }
  return <Shell title="Speakers" kicker="Keynote and invited speakers" intro="Speakers are listed here once the organising committee has confirmed them." wide>
    {speakers.length?<div className="app-grid">{speakers.map(s=><article key={s.id} className="plain-card">
      {s.photo_url?<img src={s.photo_url} alt={'Photograph of '+s.name} width={250} height={190} loading="lazy"/>:null}
      <h3>{s.name}</h3><p>{s.institution}</p><strong>{s.talk_title}</strong><p>{s.short_bio}</p>
    </article>)}</div>:<div className="message">Speakers will be announced here once confirmed by the organising committee.</div>}
  </Shell>;
}
