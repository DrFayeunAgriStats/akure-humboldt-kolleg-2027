import Link from 'next/link';
import {SiteHeader} from './SiteHeader';
import {SiteFooter} from './SiteFooter';

/** Standard inner-page layout: site header, page heading band, content, site footer. */
export function Shell({title, kicker, intro, notice, wide, children}: {
  title: string;
  kicker?: string;
  /** One-sentence introduction shown under the heading. */
  intro?: React.ReactNode;
  /** Optional status message rendered directly under the page heading (e.g. TestModeNotice). */
  notice?: React.ReactNode;
  /** Wider content column for dashboards and tables. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <SiteHeader />
    <main id="main" tabIndex={-1}>
      <div className="page-head">
        <div className={'container ' + (wide ? '' : 'container-narrow')}>
          <p className="kicker">{kicker || 'Akure Humboldt Kolleg 2027'}</p>
          <h1>{title}</h1>
          {intro && <p className="page-intro">{intro}</p>}
        </div>
      </div>
      <div className={'container page-body ' + (wide ? '' : 'container-narrow')}>
        {notice}
        {children}
      </div>
    </main>
    <SiteFooter />
  </>;
}

/**
 * Shown on participant workflows only while the database is in pre-launch test mode
 * (conference_settings.demo_mode = true). Kept accurate on purpose: entries made now
 * are test records, not official registrations or submissions.
 */
export function TestModeNotice({show}: {show: boolean}) {
  if (!show) return null;
  return <div className="notice notice-info" role="note">
    <p className="notice-title">Official registration has not opened yet</p>
    <p>Entries made now are stored as pre-launch test records. They are not official registrations or submissions and do not carry over automatically.
      Please do not upload unpublished research. See the <Link href="/privacy">privacy notice</Link>.</p>
  </div>;
}
