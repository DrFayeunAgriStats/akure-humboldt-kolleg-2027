import Link from 'next/link';
import {Shell} from '@/components/Shell';
export const metadata={title:'Page not found'};
export default function NotFound(){return <Shell title='Page not found' kicker='404'><p>This page does not exist or has not been published yet.</p><p><Link className='app-button' href='/'>Go to the conference homepage</Link></p></Shell>}
