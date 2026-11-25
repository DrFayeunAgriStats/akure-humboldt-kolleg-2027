import type {getSupabaseServer} from '@/lib/supabase/server';

const MAX_BYTES = 2 * 1024 * 1024;
const MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
} as const;
type Ext = keyof typeof MIME;

/** Check the file's leading bytes, not just its name. */
function signatureMatches(ext: Ext, b: Uint8Array) {
  if (ext === 'pdf') return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  if (ext === 'docx') return b[0] === 0x50 && b[1] === 0x4b;                                   // PK (zip)
  return b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;                    // OLE2
}

export async function uploadAbstractFile(
  db: Awaited<ReturnType<typeof getSupabaseServer>>, prefix: string, file: File
): Promise<{path: string; error?: never} | {path?: never; error: string; status: number}> {
  if (file.size > MAX_BYTES) return {error: 'The attachment exceeds 2 MB.', status: 400};
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!Object.hasOwn(MIME, ext)) return {error: 'Only PDF, DOC and DOCX attachments are accepted.', status: 400};
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureMatches(ext as Ext, bytes)) {
    return {error: 'The attachment does not appear to be a valid ' + ext.toUpperCase() + ' file.', status: 400};
  }
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const upload = await db.storage.from('abstract-files').upload(path, bytes, {contentType: MIME[ext as Ext], upsert: false});
  if (upload.error) return {error: 'Your attachment could not be uploaded. Please try again.', status: 500};
  return {path};
}
