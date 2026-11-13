import {Shell} from '@/components/Shell';
import {RegisterForm} from './form';
import {hasConfig} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default function Page(){
 const isOpen=process.env.REGISTRATION_OPEN==='true'&&hasConfig();
 return <Shell title="Conference registration" kicker="PROPOSED · FREE PARTICIPATION">
   <div className="message">The proposed conference is intended to be fully sponsored, with <strong>no registration fee</strong>, subject to organiser confirmation.</div>
   {!isOpen ? <div className="message warn"><strong>Registration is not open yet.</strong> The organising committee must first approve the conference details and privacy policy. See the <a href="/">conference homepage</a> for the proposed programme and scientific themes.</div> : <><p>Sign in first to securely register and receive a registration reference. Attendance is free; no payment step is required.</p><RegisterForm/></>}
 </Shell>;
}
