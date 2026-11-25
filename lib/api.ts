import {NextResponse} from 'next/server';import {currentUser,hasConfig} from '@/lib/supabase/server';
export const error=(message:string,status=400)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
export function wordCount(t:string){return t.trim()?t.trim().split(/\s+/u).length:0;}
export async function authorized(){if(!hasConfig())return {user:null,error:error('Conference database is not yet configured.',503)};const user=await currentUser();if(!user)return {user:null,error:error('Please sign in to continue.',401)};return {user,error:null};}
export function validText(x:unknown,min=1,max=200){return typeof x==='string' && x.trim().length>=min && x.trim().length<=max;}
export type PdfAttachment = {filename: string; content: Buffer};

export async function emailSend(to: string, subject: string, html: string, attachment?: PdfAttachment): Promise<boolean> {
  if (process.env.ZOHO_SMTP_PASSWORD) {
    const {sendZohoMail} = await import('./zoho-mail.mjs');
    return sendZohoMail(to, subject, html, attachment);
  }
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONFERENCE_FROM_EMAIL;
  if (!key || !from) return false;
  const attachments = attachment
    ? [{filename: attachment.filename, content: attachment.content.toString('base64')}]
    : undefined;
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(5000),
    headers: {Authorization: 'Bearer ' + key, 'Content-Type': 'application/json'},
    body: JSON.stringify({from, to, subject, html, attachments})
  }).then(response => response.ok).catch(() => false);
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
}
