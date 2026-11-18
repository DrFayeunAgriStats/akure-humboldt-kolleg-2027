import {Shell} from '@/components/Shell';
import {getSupabaseServer,hasConfig,requireRole} from '@/lib/supabase/server';
import {OrganiserPanel} from './panel';
import {getConferenceSettings} from '@/lib/conference-mode';
import {LaunchControls} from './launch-controls';
import Link from 'next/link';

export const metadata={title:'Organiser control centre',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page(){
  if(!hasConfig())return <Shell title="Organiser control centre"><div className="message warn">The organiser workspace is temporarily unavailable.</div></Shell>;
  const user=await requireRole('organiser');
  if(!user)return <Shell title="Access restricted"><p>This workspace requires organiser access assigned by the organising committee.</p><Link href="/dashboard">Return to my portal</Link></Shell>;
  const db=await getSupabaseServer();
  const settings=await getConferenceSettings();
  const [regs,abs,regCount,absCount,regTest,absTest,assignments,reviews,directory]=await Promise.all([
    db.from('registrations').select('id,serial_number,full_name,institution,email,category,created_at,is_demo').order('created_at',{ascending:false}).limit(100),
    db.from('abstracts').select('id,serial_number,title,track,status,author_name,institution,created_at,is_published,is_demo').order('created_at',{ascending:false}).limit(100),
    db.from('registrations').select('id',{head:true,count:'exact'}),
    db.from('abstracts').select('id',{head:true,count:'exact'}),
    db.from('registrations').select('id',{head:true,count:'exact'}).eq('is_demo',true),
    db.from('abstracts').select('id',{head:true,count:'exact'}).eq('is_demo',true),
    db.from('review_assignments').select('id,abstract_id,reviewer_id').limit(1000),
    db.from('reviews').select('assignment_id,reviewer_id,relevance,rigour,clarity,impact,recommendation,comments,updated_at').limit(1000),
    db.rpc('conference_reviewer_directory')
  ]);
  const reviewerNames=new Map<string,string>((directory.data||[]).map((x:{user_id:string;user_email:string}):[string,string]=>[x.user_id,x.user_email]));
  const assignmentIndex=new Map<string,{id:string;abstract_id:string;reviewer_id:string}>((assignments.data||[]).map((x:{id:string;abstract_id:string;reviewer_id:string}):[string,{id:string;abstract_id:string;reviewer_id:string}]=>[x.id,x]));
  const reports=(reviews.data||[]).flatMap(r=>{
    const assignment=assignmentIndex.get(r.assignment_id);
    if(!assignment)return [];
    return [{
      abstract_id:assignment.abstract_id,reviewer_id:assignment.reviewer_id,
      reviewer_email:reviewerNames.get(assignment.reviewer_id)||'Reviewer '+assignment.reviewer_id.slice(0,8),
      relevance:r.relevance,rigour:r.rigour,clarity:r.clarity,impact:r.impact,
      recommendation:r.recommendation,comments:r.comments,updated_at:r.updated_at
    }];
  });
  const assignmentCounts=Object.entries((assignments.data||[]).reduce((acc:Record<string,number>,a)=>{
    acc[a.abstract_id]=(acc[a.abstract_id]||0)+1;return acc;
  },{})).map(([abstract_id,count])=>({abstract_id,count}));
  return <Shell title="Organiser control centre" kicker="Organising committee" intro="Launch controls, reviewer access, scientific decisions and exports." wide>
    {settings.demo_mode&&<div className="message warn"><strong>Pre-launch test mode:</strong> registrations, reviews and decisions recorded now are test records. Do not issue formal invitations or acceptance letters based on them.</div>}
    {settings.available?<LaunchControls initial={settings}/>:<div className="message error">Launch settings could not be loaded. Refresh the page.</div>}
    <div className="app-grid">
      <div className="plain-card"><span className="eyebrow-small">OFFICIAL REGISTRATIONS</span><h2>{(regCount.count??0)-(regTest.count??0)}</h2><p className="help">{regTest.count??0} test record{(regTest.count??0)===1?'':'s'} kept separately</p></div>
      <div className="plain-card"><span className="eyebrow-small">OFFICIAL ABSTRACTS</span><h2>{(absCount.count??0)-(absTest.count??0)}</h2><p className="help">{absTest.count??0} test record{(absTest.count??0)===1?'':'s'} kept separately</p></div>
      <div className="plain-card"><span className="eyebrow-small">AWAITING DECISION</span>
        <h2>{(abs.data||[]).filter(x=>x.status==='submitted'||x.status==='under_review').length}</h2>
        <p className="help">Among latest 100 abstracts</p></div>
    </div>
    <p className="help">Review decisions are based on saved assessments. CSV exports include all stored records.</p>
    <div className="plain-card">
      <h3>Conference content administration</h3>
      <p>Organisers can manage the public programme and speakers without developer access.</p>
      <Link href="/dashboard/organiser/programme" className="app-button">Manage sessions & speakers ↗</Link>
    </div>
    <OrganiserPanel registrations={regs.data||[]} abstracts={abs.data||[]}
      reports={reports} assignmentCounts={assignmentCounts}/>
  </Shell>;
}
