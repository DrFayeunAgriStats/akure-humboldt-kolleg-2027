import {Shell} from '@/components/Shell';
import {RegisterForm} from './form';
import {hasConfig} from '@/lib/supabase/server';import {registrationEnabled,BID_DEMO_MODE} from '@/lib/conference-mode';
export const metadata = { title: "Registration", description: "Registration for Akure Humboldt Kolleg 2027 is free of charge and will open after committee approval." };
export const dynamic='force-dynamic';
export default function Page(){
 const isOpen=registrationEnabled()&&hasConfig();
 return <Shell title="Conference registration" kicker="WORKING DEMONSTRATION · FREE PARTICIPATION">
   <div className="message">The proposed Kolleg is fully sponsored. <strong>There is no registration fee.</strong>{BID_DEMO_MODE&&<p><strong>Demonstration only:</strong> you can test registration now. This does not reserve an official conference place; demo records may be deleted before launch. Use only test information. <a href="/privacy">Read the demo privacy notice</a>.</p>}</div>
   {!isOpen ? <div className="message warn"><strong>Registration is not open yet.</strong> Registration will be made official after committee approval. See the <a href="/">conference homepage</a> for scientific themes and announcements.</div> : <><p>Sign in with an email link, then test the registration workflow and receive a demo reference. Attendance is free; no payment step is required.</p><RegisterForm/></>}
 </Shell>;
}
