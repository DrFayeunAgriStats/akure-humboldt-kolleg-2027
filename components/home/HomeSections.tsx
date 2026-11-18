import Image from 'next/image';
import Link from 'next/link';
import {InstitutionLogo} from '@/components/InstitutionLogo';
import {VenuePhoto} from '@/components/VenuePhoto';
import {
  ABOUT, AUDIENCE, CONFERENCE, CONTACT, HERO_IMAGE, INSTITUTIONS, PARTICIPATION_STEPS,
  PROGRAMME, SUBTHEMES, SUBTHEMES_INTRO, VENUE
} from '@/lib/site-content';
import {OUTLINE_DAYS} from '@/lib/programme-outline';
import type {PublicStatus} from '@/lib/public-settings';

export function Hero({status}: {status: PublicStatus}) {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="container hero-grid">
      <div className="hero-copy">
        <p className="kicker">Humboldt Kolleg · Akure, Nigeria</p>
        <h1 id="hero-title">Biodiversity, Climate Change <em>and</em> Food&nbsp;Security</h1>
        <p className="hero-focus">{CONFERENCE.focus}.</p>
        <ul className="hero-facts" aria-label="Key facts">
          <li><span className="fact-label">Dates</span><span className="fact-value">{CONFERENCE.dates}</span></li>
          <li><span className="fact-label">Venue</span><span className="fact-value">FUTA, Akure</span></li>
          <li><span className="fact-label">Participation</span><span className="fact-value">Free</span></li>
        </ul>
        <div className="hero-ctas">
          {status.registrationOfficiallyOpen
            ? <Link href="/register" className="btn btn-primary">Register now — free</Link>
            : <Link href="/register" className="btn btn-primary">Registration information</Link>}
          <Link href="/submit" className="btn btn-secondary">Call for abstracts</Link>
          <Link href="/programme" className="text-link">View the programme</Link>
        </div>
      </div>
      <div className="hero-visual">
        <span className="hero-badge">Fully sponsored · No fees</span>
        <figure className="hero-figure">
          <Image src={HERO_IMAGE.src} alt={HERO_IMAGE.alt} fill priority sizes="(max-width: 960px) 92vw, 40vw" />
          <figcaption><strong>Biodiversity · Climate · Food</strong><span>{HERO_IMAGE.caption}</span></figcaption>
        </figure>
      </div>
    </div>
    <div className="container hero-hosts" aria-label="Host institution and sponsor">
      {[INSTITUTIONS.host, INSTITUTIONS.sponsor].map(inst =>
        <a key={inst.name} className="host-item" href={inst.url} target="_blank" rel="noopener noreferrer">
          <InstitutionLogo src={inst.logo} alt={inst.logoAlt} fallback={inst.short} width={inst.logoWidth} height={inst.logoHeight} />
          <span><span className="host-role">{inst.role}</span><span className="host-name">{inst.name}</span></span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>)}
    </div>
  </section>;
}

export function About() {
  return <section id="about" className="section" aria-labelledby="about-title">
    <div className="container about-grid">
      <div>
        <p className="kicker">Humboldt Kolleg 2027</p>
        <h2 id="about-title">About the Kolleg</h2>
        <p className="lead">{ABOUT.lead}</p>
        {ABOUT.paragraphs.map(p => <p key={p.slice(0, 24)}>{p}</p>)}
        <ul className="facts-list">
          {ABOUT.facts.map(f => <li key={f.label}>
            <span className="fact-big">{f.value}</span>
            <span><span className="fact-big-label">{f.label}</span><span className="fact-big-detail">{f.detail}</span></span>
          </li>)}
        </ul>
      </div>
      <div className="audience-panel" role="group" aria-labelledby="audience-title">
        <h3 id="audience-title">Who the Kolleg is for</h3>
        <p>{AUDIENCE.intro}</p>
        <ul className="audience-list">{AUDIENCE.groups.map(g => <li key={g}>{g}</li>)}</ul>
      </div>
    </div>
  </section>;
}

export function Subthemes() {
  return <section id="subthemes" className="section themes-section" aria-labelledby="themes-title">
    <div className="container">
      <div className="section-head">
        <div><p className="kicker kicker-light">Scientific programme</p><h2 id="themes-title">Scientific themes</h2></div>
        <p>{SUBTHEMES_INTRO}</p>
      </div>
      <ol className="theme-list-home">
        {SUBTHEMES.map(t => <li key={t.no} className="theme-item">
          <span className="theme-no" aria-hidden="true"><small>Track</small>{t.no}</span>
          <div><h3><span className="sr-only">Track {t.no}: </span>{t.title}</h3><p>{t.text}</p></div>
        </li>)}
      </ol>
      <div className="themes-cta">
        <Link href="/submit" className="btn btn-gold">Read the call for abstracts</Link>
        <Link href="/abstracts" className="btn btn-ghost-light">Browse the abstract book</Link>
      </div>
    </div>
  </section>;
}

export function Programme() {
  return <section id="programme" className="section" aria-labelledby="programme-title">
    <div className="container">
      <div className="section-head">
        <div><p className="kicker">22–25 February 2027</p><h2 id="programme-title">Programme and dates</h2></div>
        <p>{PROGRAMME.summary}</p>
      </div>
      <ol className="programme-grid" aria-label="Outline of the four days">
        {OUTLINE_DAYS.map(d => <li key={d.date} className="day">
          <span className="day-date">{d.date}</span>
          <h3>{d.theme}</h3>
          <p>{d.rows.length} outline sessions</p>
        </li>)}
      </ol>
      <div className="programme-foot">
        <p><span className="status-tag">Outline</span> {PROGRAMME.note} {PROGRAMME.caveat}</p>
        <Link href="/programme" className="btn btn-secondary">Full programme outline</Link>
      </div>
    </div>
  </section>;
}

export function Participation({status}: {status: PublicStatus}) {
  return <section id="participation" className="section section-paper" aria-labelledby="participation-title">
    <div className="container participate-grid">
      <div>
        <p className="kicker">Participation</p>
        <h2 id="participation-title">Registration and abstracts</h2>
        <p>Participation and abstract submission are free. Sign in once with your email to register, submit abstracts and follow their review.</p>
        <ol className="steps">
          {PARTICIPATION_STEPS.map(s => <li key={s.title}><div><strong>{s.title}</strong><span>{s.text}</span></div></li>)}
        </ol>
      </div>
      <div className="participate-card">
        <h3>Current status</h3>
        <p className="status-line"><b>Registration</b><span>{status.registration}</span></p>
        <p className="status-line"><b>Call for abstracts</b><span>{status.abstracts}</span></p>
        <p className="status-line"><b>Participation fee</b><span>None — fully sponsored</span></p>
        <div className="action-row">
          <Link href="/register" className="btn btn-gold">{status.registrationOfficiallyOpen ? 'Register now' : 'Registration details'}</Link>
          <Link href="/submit" className="btn btn-ghost-light">Abstract guidelines</Link>
        </div>
        <p className="signin-line">Already registered? <Link href="/login?next=/dashboard">Sign in to your portal</Link>.</p>
      </div>
    </div>
  </section>;
}

export function Venue() {
  return <section id="venue" className="section" aria-labelledby="venue-title">
    <div className="container">
      <div className="venue-grid">
        <div>
          <p className="kicker">Akure, Ondo State</p>
          <h2 id="venue-title">Venue and host institution</h2>
          <p>{VENUE.intro}</p>
          <dl className="venue-details">
            <div><dt>Host</dt><dd>{INSTITUTIONS.host.name}</dd></div>
            <div><dt>City</dt><dd>{CONFERENCE.city}</dd></div>
            <div><dt>Dates</dt><dd>{CONFERENCE.datesLong}</dd></div>
          </dl>
          <div className="action-row">
            <a className="btn btn-primary" href={VENUE.directions} target="_blank" rel="noopener noreferrer">Get directions<span className="sr-only"> (opens Google Maps in a new tab)</span></a>
            <a className="btn btn-secondary" href={VENUE.locate} target="_blank" rel="noopener noreferrer">Locate FUTA<span className="sr-only"> (opens Google Maps in a new tab)</span></a>
          </div>
        </div>
        <figure className="venue-photo">
          <VenuePhoto src={VENUE.photo.src} alt={VENUE.photo.alt} />
          <figcaption>Photo: <a href={VENUE.photo.creditUrl} target="_blank" rel="noopener noreferrer">{VENUE.photo.credit}</a> · <a href={VENUE.photo.licenceUrl} target="_blank" rel="noopener noreferrer">{VENUE.photo.licence}</a> · Cropped for display</figcaption>
        </figure>
      </div>
      <div className="map-block">
        <h3 id="map-title">Find FUTA in Akure</h3>
        <p className="muted">{VENUE.mapNote}</p>
        <div className="map-frame">
          <iframe title="Interactive map showing the Federal University of Technology Akure campus area, Nigeria" src={VENUE.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div className="map-meta">
          <span>FUTA campus area · Akure, Ondo State, Nigeria · Map data © OpenStreetMap contributors</span>
          <a href={VENUE.mapLarger} target="_blank" rel="noopener noreferrer">View larger map<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
    </div>
  </section>;
}

export function Partners() {
  return <section className="section section-paper" aria-labelledby="partners-title">
    <div className="container">
      <div className="section-head">
        <div><p className="kicker">Institutions</p><h2 id="partners-title">Host and support</h2></div>
      </div>
      <div className="partners-grid">
        {[INSTITUTIONS.host, INSTITUTIONS.sponsor].map(inst =>
          <a key={inst.name} className="partner" href={inst.url} target="_blank" rel="noopener noreferrer">
            <InstitutionLogo src={inst.logo} alt={inst.logoAlt} fallback={inst.short} width={inst.logoWidth} height={inst.logoHeight} />
            <span><span className="partner-role">{inst.role === 'Sponsored by' ? 'Sponsor' : inst.role}</span><span className="partner-name">{inst.name}</span></span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>)}
      </div>
    </div>
  </section>;
}

export function Contact() {
  return <section id="contact" className="section contact-band" aria-labelledby="contact-title">
    <div className="container contact-grid">
      <div>
        <p className="kicker kicker-light">Conference contact</p>
        <h2 id="contact-title">Contact the convener</h2>
        <p>{CONTACT.intro}</p>
      </div>
      <div className="contact-card">
        <p className="eyebrow-small">{CONTACT.role}</p>
        <h3>{CONTACT.name}</h3>
        <p>{CONTACT.department}<br />{CONTACT.institution}</p>
        <p className="contact-email">Conference enquiries: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
        <p className="contact-fine">{CONTACT.note}</p>
        <a className="btn btn-secondary" href={CONTACT.profile} target="_blank" rel="noopener noreferrer">Official FUTA staff profile<span className="sr-only"> (opens in a new tab)</span></a>
      </div>
    </div>
  </section>;
}
