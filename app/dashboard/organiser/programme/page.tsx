import Link from 'next/link';
import {Shell} from '@/components/Shell';
import {getSupabaseServer,requireRole} from '@/lib/supabase/server';
import {ConferenceContentManager} from './manager';
import {BID_DEMO_MODE} from '@/lib/conference-mode';

export const dynamic='force-dynamic';
export default async function Page(){
  const user=await requireRole('organiser');
  if(!user)return <Shell title="Restricted area"><p>Only approved organisers can manage the conference programme.</p><Link href="/dashboard">Return to portal</Link></Shell>;
  const db=await getSupabaseServer();
  const [sessions,speakers]=await Promise.all([
    db.from('sessions').select('id,title,description,starts_at,ends_at,room,session_type,published').order('starts_at'),
    db.from('speakers').select('id,name,institution,talk_title,short_bio,photo_url,published,sort_order').order('sort_order').order('name')
  ]);
  return <Shell title="Manage programme & speakers" kicker="ORGANISER CONTENT ADMINISTRATION">
    <p><Link href="/dashboard/organiser">← Back to organiser control centre</Link></p>
    {BID_DEMO_MODE&&<div className="message warn"><strong>Demonstration mode:</strong> Publish only approved sample content, clearly identified as demonstration material. No keynote speaker, venue or session is officially confirmed by this portal.</div>}
    {(sessions.error||speakers.error)&&<div className="message error">Some programme data could not be loaded. Check permissions and refresh.</div>}
    <ConferenceContentManager initialSessions={sessions.data||[]} initialSpeakers={speakers.data||[]}/>
  </Shell>;
}
