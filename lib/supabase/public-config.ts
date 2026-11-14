// These are PUBLIC, client-safe project identifiers, not service-role credentials.
// Environment variables take precedence; defaults keep the dedicated bid-demo connected.
export const SUPABASE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfihhakkeoaskfumgsbw.supabase.co';
export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_59UlrBZNgPHbFeA1BhqPwQ_bXlR-wlR";
