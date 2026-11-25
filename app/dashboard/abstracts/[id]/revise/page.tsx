import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {abstractReference} from '@/lib/conference-mode-shared';
import {revisionDeadlineLabel, revisionUuid, todayInLagos} from '@/lib/revisions';
import {CONTACT} from '@/lib/site-content';
import {getSupabaseServer, hasConfig} from '@/lib/supabase/server';
import {RevisionForm} from './revision-form';

export const metadata = {title: 'Revise your abstract', robots: {index: false, follow: false}};

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  if (!revisionUuid.test(id)) notFound();
  if (!hasConfig()) return <Shell title="Revise your abstract"><p>The portal is temporarily unavailable.</p></Shell>;
  const db = await getSupabaseServer();
  const {data: {user}} = await db.auth.getUser();
  if (!user) redirect('/login?next=' + encodeURIComponent('/dashboard/abstracts/' + id + '/revise'));

  const {data: paper, error} = await db.from('abstracts')
    .select('serial_number,is_demo,title,body,file_path,status,revision_request_id,revision_instructions,revision_due_on')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return <Shell title="Revise your abstract"><p>The abstract could not be loaded. Please try again.</p></Shell>;
  if (!paper) notFound();

  const reference = abstractReference(paper.serial_number, paper.is_demo);
  return <Shell title="Revise your abstract" kicker={reference}>
    <p><Link href="/dashboard">Return to my portal</Link></p>
    {paper.status !== 'revision_requested' ? <p>There is no open revision request for this abstract.</p> :
      <section className="plain-card">
        <h2>Requested corrections</h2>
        <p style={{whiteSpace: 'pre-wrap'}}>{paper.revision_instructions}</p>
        {paper.revision_due_on && <p><strong>Due {revisionDeadlineLabel(paper.revision_due_on)}</strong> (West Africa Time)</p>}
        {paper.revision_due_on && paper.revision_due_on < todayInLagos()
          ? <p>The deadline has passed. Contact the <a href={'mailto:' + CONTACT.secretariatEmail}>conference secretariat</a>.</p>
          : <RevisionForm id={id} request={paper.revision_request_id} title={paper.title} body={paper.body} hasFile={Boolean(paper.file_path)} />}
      </section>}
  </Shell>;
}
