import Link from 'next/link';
import {SiteNav} from './SiteNav';

export function Shell({title, kicker, notice, children}: {
  title: string;
  kicker?: string;
  /** Optional status banner rendered directly under the page heading (e.g. TestModeNotice). */
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <SiteNav />
    <main id="main" className="application-shell" tabIndex={-1}>
      <div className="eyebrow-small">{kicker || 'AKURE HUMBOLDT KOLLEG 2027'}</div>
      <h1>{title}</h1>
      {notice}
      {children}
    </main>
    <footer className="app-footer">
      <span>Akure Humboldt Kolleg 2027 · 22–25 February 2027 · FUTA, Akure, Nigeria</span>
      <span><Link href="/privacy">Privacy notice</Link> · Website by <a href="https://ableflourish.com" target="_blank" rel="noopener noreferrer">Able-Flourish Digital Solutions</a></span>
    </footer>
  </>;
}

/** Shown on participant workflows only while the database is in pre-launch test mode. */
export function TestModeNotice({show}: {show: boolean}) {
  if (!show) return null;
  return <div className="message warn" role="note">
    <strong>Official registration has not opened yet.</strong> The participant system is in pre-launch testing.
    Anything entered now is stored as a test record, is not an official registration or submission, and will not
    carry over automatically. Please do not upload unpublished research. <Link href="/privacy">Privacy notice</Link>.
  </div>;
}
