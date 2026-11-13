import {Shell} from '@/components/Shell';
import {AbstractForm} from './form';
import {hasConfig} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default function Page(){
 const isOpen=process.env.SUBMISSIONS_OPEN==='true'&&hasConfig();
 return <Shell title="Submit a scientific abstract" kicker="CALL FOR ABSTRACTS">
  <p>Abstracts must contain 250–300 words and should be submitted under one of the five themes. Submission and conference participation are free.</p>
  {!isOpen?<div className="message warn"><strong>Abstract submission is not open yet.</strong> The organising committee will announce the submission deadline and activate the secure portal. You can explore a fictional submission on the <a href="/#abstracts">homepage demonstration</a>.</div> : <><p>Sign in and complete free registration before submitting. Your research remains private unless specifically approved for publication.</p><AbstractForm/></>}
 </Shell>;
}
