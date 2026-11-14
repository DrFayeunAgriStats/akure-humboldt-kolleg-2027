import {Shell} from '@/components/Shell';
import {RegisterForm} from './form';
import {hasConfig,currentUser} from '@/lib/supabase/server';import {registrationEnabled,BID_DEMO_MODE} from '@/lib/conference-mode';
export const metadata = { title: "Registration", description: "Try the working no-fee registration flow for the Akure Humboldt Kolleg 2027 bidding demonstration. Not official registration." };
export const dynamic='force-dynamic';
export default async function Page(){
 const user=hasConfig()?await currentUser():null;
 const isOpen=registrationEnabled()&&hasConfig();
 return <Shell title="Conference registration" kicker="WORKING DEMONSTRATION · FREE PARTICIPATION">
   <div className="message">The proposed Kolleg is fully sponsored. <strong>There is no registration fee.</strong>{BID_DEMO_MODE&&<p><strong>Demonstration only:</strong> you can test registration now. This does not reserve an official conference place; demo records may be deleted before launch. Use only test information. <a href="/privacy">Read the demo privacy notice</a>.</p>}</div>
   {!isOpen ? <div className="message warn"><strong>Registration is not open yet.</strong> Registration will be made official after committee approval. See the <a href="/">conference homepage</a> for scientific themes and announcements.</div> : <><p>Sign in with an email link, then test the registration workflow and receive a demo reference. Attendance is free; no payment step is required.</p>{!user?<div className="message"><strong>Sign in to begin.</strong> <a href="/login">Email me a sign-in link</a>. Once signed in, you can register and receive a demonstration reference.</div>:<RegisterForm/>}</>}
 </Shell>;
}
