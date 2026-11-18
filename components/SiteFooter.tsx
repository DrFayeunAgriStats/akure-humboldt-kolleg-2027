import Link from 'next/link';
import {NexusMark} from './NexusMark';
import {CONFERENCE, CONTACT, INSTITUTIONS} from '@/lib/site-content';

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-identity">
        <p className="footer-brand"><NexusMark size={34} /> <span>{CONFERENCE.name}</span></p>
        <p>{CONFERENCE.theme}</p>
        <p className="footer-meta">{CONFERENCE.dates} · {CONFERENCE.venueShort}</p>
        <p className="footer-meta">Hosted by {INSTITUTIONS.host.name}. Sponsored by the {INSTITUTIONS.sponsor.name}.</p>
      </div>
      <nav aria-label="Conference" className="footer-col">
        <h2>Conference</h2>
        <ul>
          <li><Link href="/#about">About the Kolleg</Link></li>
          <li><Link href="/#subthemes">Scientific sub-themes</Link></li>
          <li><Link href="/programme">Programme</Link></li>
          <li><Link href="/speakers">Speakers</Link></li>
          <li><Link href="/abstracts">Abstract book</Link></li>
          <li><Link href="/#venue">Venue and travel</Link></li>
        </ul>
      </nav>
      <nav aria-label="Participate" className="footer-col">
        <h2>Participate</h2>
        <ul>
          <li><Link href="/register">Registration</Link></li>
          <li><Link href="/submit">Call for abstracts</Link></li>
          <li><Link href="/dashboard">My portal</Link></li>
          <li><Link href="/login">Sign in</Link></li>
        </ul>
      </nav>
      <div className="footer-col">
        <h2>Contact</h2>
        <p>{CONTACT.name}<br />{CONTACT.role}</p>
        <p><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
      </div>
    </div>
    <div className="container footer-bottom">
      <span>© 2026 {CONFERENCE.name} Organising Committee. Conference details are subject to confirmation.</span>
      <span><Link href="/privacy">Privacy notice</Link> · Website by <a href="https://ableflourish.com" target="_blank" rel="noopener noreferrer">Able-Flourish Digital Solutions</a></span>
    </div>
  </footer>;
}
