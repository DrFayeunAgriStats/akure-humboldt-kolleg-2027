import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {LOC_TEST_COOKIE} from '@/lib/conference-mode';

export default async function Page() {
  const active = (await cookies()).get(LOC_TEST_COOKIE)?.value === '1';
  async function chooseMode(data: FormData) {
    'use server';
    const jar = await cookies();
    if (data.get('mode') === 'test') {
      jar.set(LOC_TEST_COOKIE, '1', {path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production'});
    } else {
      jar.delete(LOC_TEST_COOKIE);
    }
    redirect('/register');
  }
  return <Shell title="LOC testing">
    <p>Use this browser to test registration and abstract submission. Test entries are excluded from official exports and cannot appear in the abstract book.</p>
    <p>Return here to leave testing before registering as an official participant.</p>
    <form action={chooseMode}><button className="app-button" name="mode" value="test">Enter LOC testing</button>
      {active && <button className="app-button app-btn-secondary" name="mode" value="official">Leave LOC testing</button>}
    </form>
  </Shell>;
}
