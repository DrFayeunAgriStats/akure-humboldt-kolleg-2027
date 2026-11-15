'use client';
import {createBrowserClient} from '@supabase/ssr';
import {SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY} from '@/lib/supabase/public-config';

export function SignOut(){
  return <button className="app-button app-btn-secondary" onClick={async()=>{
    if(!SUPABASE_PUBLIC_URL||!SUPABASE_PUBLIC_KEY){
      window.alert('Sign-out configuration is unavailable.');
      return;
    }
    const db=createBrowserClient(SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY);
    const {error}=await db.auth.signOut();
    if(error){window.alert('Could not sign out. Please try again.');return;}
    window.location.href='/login';
  }}>Sign out</button>;
}
