import {Shell} from '@/components/Shell';
export const metadata = {
 title: 'Bid demonstration privacy notice',
 description: 'How test data is used and deleted in the Akure Humboldt Kolleg 2027 working website demonstration.'
};
export default function Page(){
 return <Shell title="Working demonstration: privacy notice" kicker="TEST DATA · NOT OFFICIAL REGISTRATION">
  <div className="message warn"><strong>This is a functional bid demonstration, not the official opening of conference registration.</strong> Please use test entries and do not upload unpublished research, confidential papers or sensitive information.</div>
  <h2>Purpose and responsible team</h2>
  <p>Able-Flourish Digital Solutions is operating this trial website to demonstrate conference registration, abstract submission, peer review, organiser reporting and publication controls to the organising committee of Akure Humboldt Kolleg 2027. The conference convener is Prof. Jonathan C. Onyekwelu, Department of Forestry and Wood Technology, FUTA. For questions, contact <a href="mailto:jconyekwelu@futa.edu.ng">jconyekwelu@futa.edu.ng</a>.</p>
  <h2>Information recorded</h2>
  <p>Signing in requires your email address. Demo registration asks for your name, institutional affiliation, country, participation category and choices about the proposed Kolleg. City and telephone are optional. Demo abstract submission also stores a title, authors, text, keywords, presentation preference and any attachment you choose to upload.</p>
  <h2>Who can see trial information</h2>
  <p>Your registration and submitted abstracts are stored in the conference-specific database and are accessible to your authenticated account and authorised organiser users. A reviewer may see only an abstract assigned to them. Attachments are stored privately. If an organiser explicitly accepts and releases an abstract during testing, its public version may become visible on the demo abstract-book page. <strong>Do not test with actual unpublished work.</strong></p>
  <h2>Trial records and deletion</h2>
  <p>Trial submissions are marked as demonstration data. They are not official conference registrations or submissions and do not reserve a place or indicate acceptance. The operating team may delete demo registrations, abstracts, files and test accounts before the official conference opens. If you need removal earlier, email the convener. No payment information is collected.</p>
  <h2>Your choice</h2>
  <p>Participating in the test is optional. Do not enter any information you would not want the organising team to see while evaluating the platform. You can browse the scientific themes without signing in and try the <a href="/prototype.html">browser-only guided workflow demonstration</a> without sending a registration or abstract to the conference database.</p>
 </Shell>;
}
