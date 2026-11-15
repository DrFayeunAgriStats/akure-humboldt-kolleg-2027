import {Shell} from '@/components/Shell';
import Link from 'next/link';
import {getSupabaseServer,hasConfig,currentUser,requireRole} from '@/lib/supabase/server';
import {SignOut} from '../sign-out';
import {ReviewForm} from './review-form';

export const dynamic='force-dynamic';

export default async function Page(){
  if(!hasConfig())return <Shell title="Reviewer workspace"><div className="message warn">Reviewer login is not yet configured.</div></Shell>;
  const me=await currentUser();
  if(!me)return <Shell title="Reviewer sign-in"><p>Sign in using the email address assigned the reviewer role.</p><Link className="app-button" href="/login">Sign in</Link></Shell>;
  const reviewer=await requireRole('reviewer');
  if(!reviewer)return <Shell title="Restricted reviewer area">
    <div className="message warn">Signed in as <strong>{me.email}</strong>. This account does not have the reviewer role.</div>
    <p>To open an assigned review, sign out and sign in using the authorised reviewer email address. Organiser and reviewer accounts cannot share one browser session.</p>
    <SignOut/>
  </Shell>;
  const db=await getSupabaseServer();
  const r=await db.from('review_assignments')
    .select('id,abstract_id,abstracts(id,serial_number,title,body,track,keywords,status,is_demo)')
    .eq('reviewer_id',reviewer.id);
  return <Shell title="My assigned abstract reviews" kicker="PEER REVIEW WORKSPACE">
    <p>Signed in as <strong>{me.email}</strong>. Each reviewer can access only the abstracts assigned to their account. This is a bid demonstration; test reviews and abstracts are not official decisions.</p>
    {r.data?.length?r.data.map((x:any)=><article className="plain-card" key={x.id}>
      <div className="eyebrow-small">{x.abstracts?.is_demo?'DEMO-AKH-ABS-':'AKH-ABS-'}{String(x.abstracts?.serial_number).padStart(4,'0')} · Track {x.abstracts?.track}</div>
      <h3>{x.abstracts?.title}</h3>
      <p>{x.abstracts?.body}</p>
      <ReviewForm assignmentId={x.id}/>
    </article>):<div className="message">No abstracts assigned to this reviewer yet.</div>}
  </Shell>;
}
