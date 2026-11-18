import {SiteHeader} from '@/components/SiteHeader';
import {SiteFooter} from '@/components/SiteFooter';
import {About, Contact, Hero, Participation, Partners, Programme, Subthemes, Venue} from '@/components/home/HomeSections';
import {getPublicConferenceSettings, publicStatus} from '@/lib/public-settings';

export const metadata = {alternates: {canonical: '/'}};
// The registration status shown on the homepage is refreshed at most every minute.
export const revalidate = 60;

export default async function HomePage() {
  const status = publicStatus(await getPublicConferenceSettings());
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <SiteHeader />
    <main id="main" className="home" tabIndex={-1}>
      <Hero status={status} />
      <About />
      <Subthemes />
      <Programme />
      <Participation status={status} />
      <Venue />
      <Partners />
      <Contact />
    </main>
    <SiteFooter />
  </>;
}
