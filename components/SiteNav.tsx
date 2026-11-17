'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useState} from 'react';

const LINKS = [
  {href: '/programme', label: 'Programme'},
  {href: '/speakers', label: 'Speakers'},
  {href: '/abstracts', label: 'Abstract book'},
  {href: '/register', label: 'Register'},
  {href: '/submit', label: 'Submit abstract'}
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return <header className="header-mini">
    <div className="header-mini-inner">
      <Link href="/" className="header-mini-brand">Akure Humboldt Kolleg <span>2027</span></Link>
      <button type="button" className="header-mini-toggle" aria-expanded={open} aria-controls="site-nav-links"
        onClick={() => setOpen(v => !v)}>
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <span aria-hidden="true" className="header-mini-burger" />
      </button>
      <nav id="site-nav-links" aria-label="Conference" className={'header-mini-nav' + (open ? ' is-open' : '')}>
        {LINKS.map(l => <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>{l.label}</Link>)}
        <Link href="/dashboard" className="header-mini-portal" aria-current={isActive('/dashboard') ? 'page' : undefined}>My portal</Link>
      </nav>
    </div>
  </header>;
}
