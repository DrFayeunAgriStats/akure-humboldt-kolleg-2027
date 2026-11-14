import {Shell} from '@/components/Shell';
import {RegisterForm} from './form';
import {hasConfig} from '@/lib/supabase/server';
export const metadata = { title: "Registration", description: "Registration for Akure Humboldt Kolleg 2027 is free of charge and will open after committee approval." };
export const dynamic='force-dynamic';
export default function Page(){
 const isOpen=process.env.REGISTRATION_OPEN==='true'&&hasConfig();
 return <Shell title="Conference registration" kicker="PROPOSED · FREE PARTICIPATION">
   <div className="message">The proposed Kolleg is fully sponsored. <strong>There is no registration fee.</strong></div>
   {!isOpen ? <div className="message warn"><strong>Registration is not open yet.</strong> Registration will open after committee approval. See the <a href="/">conference homepage</a> for scientific themes and announcements.</div> : <><p>Sign in first to securely register and receive a registration reference. Attendance is free; no payment step is required.</p><RegisterForm/></>}
 </Shell>;
}
