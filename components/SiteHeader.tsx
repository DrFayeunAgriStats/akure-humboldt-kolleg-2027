'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {NexusMark} from './NexusMark';

const NAV = [
  {href: '/about', label: 'About'},
  {href: '/subthemes', label: 'Sub-themes'},
  {href: '/programme', label: 'Programme'},
  {href: '/speakers', label: 'Speakers'},
  {href: '/venue', label: 'Venue'},
  {href: '/abstracts', label: 'Abstract book'}
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const current = (href: string) => !href.includes('#') && (pathname === href || pathname.startsWith(href + '/')) ? 'page' : undefined;
  const portalCurrent = pathname.startsWith('/dashboard') ? 'page' : undefined;

  return <header className="site-header">
    <div className="container site-header-inner">
      <Link href="/" className="brand" aria-label="Akure Humboldt Kolleg 2027 — home">
        <NexusMark size={38} className="brand-mark" />
        <span className="brand-text"><span className="brand-name">Akure Humboldt Kolleg <span className="brand-year">2027</span></span>
          <span className="brand-meta">15–18 Mar 2027 · FUTA, Akure</span></span>
      </Link>
      <button ref={toggleRef} type="button" className="nav-toggle" aria-expanded={open} aria-controls="site-nav"
        onClick={() => setOpen(v => !v)}>
        <span className="nav-toggle-bars" aria-hidden="true" /><span className="nav-toggle-label">{open ? 'Close' : 'Menu'}</span>
      </button>
      <nav id="site-nav" aria-label="Main" className={'site-nav' + (open ? ' is-open' : '')}>
        <ul className="site-nav-links">
          {NAV.map(l => <li key={l.href}><Link href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)}>{l.label}</Link></li>)}
        </ul>
        <div className="site-nav-actions">
          <Link href="/dashboard" className="nav-portal" aria-current={portalCurrent}>My portal</Link>
          <Link href="/submit" className="btn btn-secondary btn-sm" aria-current={current('/submit')}>Submit abstract</Link>
          <Link href="/register" className="btn btn-primary btn-sm" aria-current={current('/register')}>Register</Link>
        </div>
      </nav>
    </div>
  </header>;
}
