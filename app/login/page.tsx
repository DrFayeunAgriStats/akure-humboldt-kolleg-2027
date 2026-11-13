import {Shell} from '@/components/Shell';import {LoginForm} from './form';
export default function Page(){return <Shell title="Sign in to the conference portal" kicker="SECURE PARTICIPANT & STAFF ACCESS"><p>Sign in using a one-time email link. Organiser and reviewer accounts need an assigned role.</p><LoginForm /></Shell>}
