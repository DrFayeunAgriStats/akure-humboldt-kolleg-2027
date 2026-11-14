export const metadata = { title: "Participant Login", description: "Secure email sign-in for Akure Humboldt Kolleg 2027 participants and organisers." };
import {Shell} from '@/components/Shell';import {LoginForm} from './form';
export default function Page(){return <Shell title="Sign in to the conference portal" kicker="SECURE PARTICIPANT & STAFF ACCESS"><p>Sign in using a one-time email link. Organiser and reviewer accounts need an assigned role.</p><LoginForm /></Shell>}
