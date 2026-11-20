import {SiteHeader} from '@/components/SiteHeader';
import {SiteFooter} from '@/components/SiteFooter';

export default function ConferenceLayout({children}: {children: React.ReactNode}) {
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <SiteHeader />
    <main id="main" className="home" tabIndex={-1}>{children}</main>
    <SiteFooter />
  </>;
}
