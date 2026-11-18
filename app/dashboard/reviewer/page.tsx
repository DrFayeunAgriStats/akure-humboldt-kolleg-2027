import {Shell} from '@/components/Shell';
import Link from 'next/link';
import {getSupabaseServer,hasConfig,currentUser,requireRole} from '@/lib/supabase/server';
import {SignOut} from '../sign-out';
import {ReviewForm} from './review-form';
import {abstractReference} from '@/lib/conference-mode-shared';

export const metadata={title:'Reviewer workspace',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';

type Assignment={assignment_id:string;abstract_id:string;serial_number:number;title:string;body:string;track:number;keywords:string[]|null;presentation_type:string;status:string;is_demo:boolean;file_path:string|null};
type ExistingReview={assignment_id:string;relevance:number;rigour:number;clarity:number;impact:number;recommendation:string;comments:string};
export default async function Page(){
  if(!hasConfig())return <Shell title="Reviewer workspace"><div className="message warn">Reviewer login is not yet configured.</div></Shell>;
  const me=await currentUser();
  if(!me)return <Shell title="Reviewer sign-in"><p>Sign in using your authorised reviewer email address.</p><Link className="app-button" href="/login?next=/dashboard/reviewer">Sign in</Link></Shell>;
  const reviewer=await requireRole('reviewer');
  if(!reviewer)return <Shell title="Restricted reviewer area">
    <div className="message warn">Signed in as <strong>{me.email}</strong>. This account does not have the reviewer role.</div>
    <p>Use a separate browser profile or sign out and sign in with the authorised reviewer email.</p><SignOut/>
  </Shell>;
  const db=await getSupabaseServer();
  // Blind review: assignments come from an RPC that returns no author fields and
  // requires a current reviewer role (see migration 20261118000100).
  const [assignments,reviews]=await Promise.all([
    db.rpc('conference_reviewer_assignments'),
    db.from('reviews')
      .select('assignment_id,relevance,rigour,clarity,impact,recommendation,comments')
      .eq('reviewer_id',reviewer.id)
  ]);
  const existing=new Map<string,ExistingReview>((reviews.data||[]).map((r:ExistingReview):[string,ExistingReview]=>[r.assignment_id,r]));
  const papers=await Promise.all(((assignments.data||[]) as Assignment[]).map(async x=>{
    const link=x.file_path?await db.storage.from('abstract-files').createSignedUrl(x.file_path,180):null;
    return {...x,attachment:link?.data?.signedUrl||null};
  }));
  return <Shell title="My assigned abstract reviews" kicker="PEER REVIEW WORKSPACE">
    <p>Signed in as <strong>{me.email}</strong>. You can assess only abstracts assigned to your account. Author identities are withheld for blind review.</p>
    {assignments.error&&<div className="message error">Assignments could not be loaded. Please refresh.</div>}
    {papers.length?papers.map(x=><article className="plain-card" key={x.assignment_id}>
      <div className="eyebrow-small">{abstractReference(x.serial_number,x.is_demo)}{x.is_demo?' · TEST RECORD':''} · Sub-theme {x.track} · {x.presentation_type==='poster'?'Poster':'Oral'}</div>
      <h3>{x.title}</h3><p>{x.body}</p>{x.keywords?.length?<p className="help">Keywords: {x.keywords.join(', ')}</p>:null}
      {x.attachment?<p><a href={x.attachment} className="app-button" target="_blank" rel="noreferrer">Open submitted attachment (temporary secure link) ↗</a></p>:
        <p className="help">{x.file_path?'Attachment unavailable; contact the organiser.':'No attachment supplied. Review the abstract text above.'}</p>}
      <ReviewForm assignmentId={x.assignment_id} initialReview={existing.get(x.assignment_id)}/>
    </article>):<div className="message">No abstracts assigned to this reviewer yet.</div>}
  </Shell>;
}
