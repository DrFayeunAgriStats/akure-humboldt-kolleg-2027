import Link from 'next/link';
import {Shell} from '@/components/Shell';
import {getSupabaseServer,requireRole} from '@/lib/supabase/server';
import {ConferenceContentManager} from './manager';

export const metadata={title:'Manage programme & speakers',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page(){
  const user=await requireRole('organiser');
  if(!user)return <Shell title="Restricted area"><p>Only approved organisers can manage the conference programme.</p><Link href="/dashboard">Return to portal</Link></Shell>;
  const db=await getSupabaseServer();
  const [sessions,speakers]=await Promise.all([
    db.from('sessions').select('id,title,description,starts_at,ends_at,room,session_type,published').order('starts_at'),
    db.from('speakers').select('id,name,institution,talk_title,short_bio,photo_url,published,sort_order').order('sort_order').order('name')
  ]);
  return <Shell title="Manage programme & speakers" kicker="Organising committee" intro="Draft, publish and update sessions and speakers. Unpublished items stay private to organisers." wide>
    <p><Link href="/dashboard/organiser">← Back to organiser control centre</Link></p>
    <div className="message" role="note"><strong>Publishing is public.</strong> Publish only sessions and speakers the organising committee has confirmed; unpublished items stay private to organisers.</div>
    {(sessions.error||speakers.error)&&<div className="message error">Some programme data could not be loaded. Check permissions and refresh.</div>}
    <ConferenceContentManager initialSessions={sessions.data||[]} initialSpeakers={speakers.data||[]}/>
  </Shell>;
}
