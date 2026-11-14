import {createServerClient} from '@supabase/ssr';import {cookies} from 'next/headers';
import {SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY} from './public-config';
export function hasConfig(){return Boolean(SUPABASE_PUBLIC_URL&&SUPABASE_PUBLIC_KEY)}
export async function getSupabaseServer(){if(!hasConfig())throw new Error('Supabase is not configured');const cookieStore=await cookies();return createServerClient(SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY,{cookies:{getAll(){return cookieStore.getAll()},setAll(items){try{items.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{/* Server Component context cannot write cookies; proxy refreshes */}}}})}
export async function currentUser(){if(!hasConfig())return null;const db=await getSupabaseServer();const {data:{user}}=await db.auth.getUser();return user;}
export async function requireRole(role:'organiser'|'reviewer'){const db=await getSupabaseServer();const {data:{user}}=await db.auth.getUser();if(!user)return null;const r=await db.from('user_roles').select('role').eq('user_id',user.id).eq('role',role).maybeSingle();return r.data?user:null;}
