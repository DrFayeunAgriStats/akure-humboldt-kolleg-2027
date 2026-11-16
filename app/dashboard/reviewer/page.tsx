import {Shell} from '@/components/Shell';
import Link from 'next/link';
import {getSupabaseServer,hasConfig,currentUser,requireRole} from '@/lib/supabase/server';
import {SignOut} from '../sign-out';
import {ReviewForm} from './review-form';

export const dynamic='force-dynamic';

type ExistingReview={assignment_id:string;relevance:number;rigour:number;clarity:number;impact:number;recommendation:string;comments:string};
export default async function Page(){
  if(!hasConfig())return <Shell title="Reviewer workspace"><div className="message warn">Reviewer login is not yet configured.</div></Shell>;
  const me=await currentUser();
  if(!me)return <Shell title="Reviewer sign-in"><p>Sign in using your authorised reviewer email address.</p><Link className="app-button" href="/login">Sign in</Link></Shell>;
  const reviewer=await requireRole('reviewer');
  if(!reviewer)return <Shell title="Restricted reviewer area">
    <div className="message warn">Signed in as <strong>{me.email}</strong>. This account does not have the reviewer role.</div>
    <p>Use a separate browser profile or sign out and sign in with the authorised reviewer email.</p><SignOut/>
  </Shell>;
  const db=await getSupabaseServer();
  const [assignments,reviews]=await Promise.all([
    db.from('review_assignments')
      .select('id,abstract_id,abstracts(id,serial_number,title,body,track,keywords,status,is_demo,file_path)')
      .eq('reviewer_id',reviewer.id),
    db.from('reviews')
      .select('assignment_id,relevance,rigour,clarity,impact,recommendation,comments')
      .eq('reviewer_id',reviewer.id)
  ]);
  const existing=new Map<string,ExistingReview>((reviews.data||[]).map((r:ExistingReview):[string,ExistingReview]=>[r.assignment_id,r]));
  const papers=await Promise.all((assignments.data||[]).map(async (x:any)=>{
    const path=x.abstracts?.file_path as string|null|undefined;
    const link=path?await db.storage.from('abstract-files').createSignedUrl(path,180):null;
    return {...x,attachment:link?.data?.signedUrl||null};
  }));
  return <Shell title="My assigned abstract reviews" kicker="PEER REVIEW WORKSPACE">
    <p>Signed in as <strong>{me.email}</strong>. You can assess only abstracts assigned to your account. All records in this evaluation site are demonstration records, not official conference decisions.</p>
    {assignments.error&&<div className="message error">Assignments could not be loaded. Please refresh.</div>}
    {papers.length?papers.map((x:any)=><article className="plain-card" key={x.id}>
      <div className="eyebrow-small">{x.abstracts?.is_demo?'DEMO-AKH-ABS-':'AKH-ABS-'}{String(x.abstracts?.serial_number).padStart(4,'0')} · Track {x.abstracts?.track}</div>
      <h3>{x.abstracts?.title}</h3><p>{x.abstracts?.body}</p>
      {x.attachment?<p><a href={x.attachment} className="app-button" target="_blank" rel="noreferrer">Open submitted attachment (temporary secure link) ↗</a></p>:
        <p className="help">{x.abstracts?.file_path?'Attachment unavailable; contact the organiser.':'No attachment supplied. Review the abstract text above.'}</p>}
      <ReviewForm assignmentId={x.id} initialReview={existing.get(x.id)}/>
    </article>):<div className="message">No abstracts assigned to this reviewer yet.</div>}
  </Shell>;
}
