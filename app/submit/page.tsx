import {Shell} from '@/components/Shell';
import {AbstractForm} from './form';
import {hasConfig,currentUser,getSupabaseServer} from '@/lib/supabase/server';import {submissionsEnabled,BID_DEMO_MODE} from '@/lib/conference-mode';
export const metadata = { title: "Call for Abstracts", description: "Abstracts of 250–300 words under five scientific sub-themes. Test the free, working abstract-submission flow during the bidding demonstration. Not official submission." };
export const dynamic='force-dynamic';
export default async function Page(){
 const user=hasConfig()?await currentUser():null;
 let registered=false;
 if(user){const db=await getSupabaseServer();const r=await db.from('registrations').select('id').eq('user_id',user.id).maybeSingle();registered=Boolean(r.data)}
 const isOpen=submissionsEnabled()&&hasConfig();
 return <Shell title="Submit a scientific abstract" kicker="DEMONSTRATION · ABSTRACT WORKFLOW">
  <p>Abstracts must contain 250–300 words and should be submitted under one of the five themes. Submission and conference participation are free.</p>{BID_DEMO_MODE&&<div className="message warn"><strong>Bid demonstration:</strong> abstract submission is enabled for testing. Do not upload unpublished or confidential research. Demo abstracts may be deleted before official conference launch. <a href="/privacy">Privacy notice</a>.</div>}
  {!isOpen?<div className="message warn"><strong>Abstract submission is not open yet.</strong> Official abstract submission will open after committee approval, when the deadline is published. Please consult the <a href="/">conference homepage</a> for current announcements.</div> : <><p>Sign in and complete a demo registration before submitting. Your research remains private unless specifically approved for publication.</p>{!user?<div className="message"><strong>Sign in first.</strong> <a href="/login">Email me a sign-in link</a> to try the abstract workflow.</div>:!registered?<div className="message"><strong>Register first.</strong> <a href="/register">Complete a demo registration</a> before submitting a trial abstract.</div>:<AbstractForm/>}</>}
 </Shell>;
}
