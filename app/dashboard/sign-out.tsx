'use client';
import {createBrowserClient} from '@supabase/ssr';
import {SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY} from '@/lib/supabase/public-config';
import {useToast} from '@/components/ToastProvider';

export function SignOut(){
  const toast=useToast();
  return <button className="app-button app-btn-secondary" onClick={async()=>{
    if(!SUPABASE_PUBLIC_URL||!SUPABASE_PUBLIC_KEY){
      toast('Sign-out configuration is unavailable.','error');
      return;
    }
    const db=createBrowserClient(SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY);
    const {error}=await db.auth.signOut();
    if(error){toast('Could not sign out. Please try again.','error');return;}
    window.location.href='/login';
  }}>Sign out</button>;
}
