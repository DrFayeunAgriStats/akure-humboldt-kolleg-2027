import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {LoginForm} from '../login/form';
import {currentUser} from '@/lib/supabase/server';
import {safeNext} from '@/lib/redirect';

export default async function Page({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const next = safeNext((await searchParams).next);
  if (!await currentUser()) redirect('/login?mode=recover&next=' + encodeURIComponent(next));
  return <Shell title="Choose your password"><LoginForm mode="set" next={next} /></Shell>;
}
