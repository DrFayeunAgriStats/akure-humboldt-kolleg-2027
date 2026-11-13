import {Shell} from '@/components/Shell';
import {RegisterForm} from './form';
import {hasConfig} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default function Page(){
 const isOpen=process.env.REGISTRATION_OPEN==='true'&&hasConfig();
 return <Shell title="Conference registration" kicker="FREE · FULLY SPONSORED">
   <div className="message">Participation in the proposed Akure Humboldt Kolleg 2027 is fully sponsored. <strong>There is no registration fee.</strong></div>
   {!isOpen ? <div className="message warn"><strong>Registration is not open yet.</strong> The organising committee must first approve the conference details and privacy policy. You can explore the interactive demonstration on the <a href="/#registration">homepage</a>, but please do not enter real personal details there.</div> : <><p>Sign in first to securely register and receive a registration reference. Attendance is free; no payment step is required.</p><RegisterForm/></>}
 </Shell>;
}
