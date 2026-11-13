import {createClient} from '@supabase/supabase-js';
/** SERVER ONLY. Bypasses RLS for trusted payment webhook reconciliation, never browser. */
export function getAdminClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw new Error('Missing server-only Supabase credentials');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
