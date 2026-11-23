import Link from 'next/link';
import {Shell} from '@/components/Shell';

export const metadata = {
  title: 'Privacy notice',
  description: 'How Akure Humboldt Kolleg 2027 collects, uses and protects the personal information of participants, authors and reviewers.',
  alternates: {canonical: '/privacy'}
};

// NOTE FOR THE ORGANISING COMMITTEE: this notice should be reviewed and approved by
// the LOC (and FUTA's data-protection contact) before official registration opens.
export default function Page() {
  return <Shell title="Privacy notice" kicker="Akure Humboldt Kolleg 2027" intro="How we collect, use and protect the information of participants, authors and reviewers.">
    <div className="prose">
      <h2>Who is responsible</h2>
      <p>This website is operated for the Local Organising Committee of Akure Humboldt Kolleg 2027, hosted by the
        Federal University of Technology, Akure (FUTA), by Able-Flourish Digital Solutions. The conference convener is
        Prof. Jonathan C. Onyekwelu, Department of Forestry and Wood Technology, FUTA. Questions about your information:
        {' '}<a href="mailto:jconyekwelu@futa.edu.ng">jconyekwelu@futa.edu.ng</a>.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Sign-in:</strong> your email address identifies your account. You sign in with a password.</li>
        <li><strong>Registration:</strong> name, institution, country, delegate category and your answers about Humboldt status and participation. City and phone number are optional.</li>
        <li><strong>Abstracts:</strong> title, authors, institution, abstract text, keywords, presentation preference and any attachment you upload.</li>
        <li><strong>Peer review:</strong> reviewers' scores and comments on the abstracts assigned to them.</li>
      </ul>
      <p>No payment information is collected: participation is free.</p>

      <h2>Who can see it</h2>
      <ul>
        <li>You can see your own registration and abstracts in your portal.</li>
        <li>Authorised organisers can see registrations, abstracts and reviews in order to run the Kolleg.</li>
        <li>Reviewers see only the abstracts assigned to them, without author names, and the attachments for those abstracts.</li>
        <li>Attachments are stored privately and are opened through short-lived secure links.</li>
        <li>An abstract is published in the public abstract book only if it is accepted and the committee releases it.</li>
      </ul>

      <h2>Photographs and video</h2>
      <p>We use photographs or video of you in conference communications only if you give separate, optional consent when registering.</p>

      <h2>Pre-launch test records</h2>
      <p>Before official registration opens, the participant system may be tested. Entries made during testing are
        stored as test records. They are not official registrations or submissions, do not reserve a place and are
        handled separately from official records. Ask the convener if you want a test record removed.</p>

      <h2>Retention and your choices</h2>
      <p>Registration and abstract information is kept for as long as needed to organise the Kolleg and its follow-up
        reporting, then deleted or anonymised as decided by the organising committee. You can ask to see, correct or
        delete your information by emailing the convener.</p>

      <p><Link href="/">Return to the conference homepage</Link></p>
    </div>
  </Shell>;
}
