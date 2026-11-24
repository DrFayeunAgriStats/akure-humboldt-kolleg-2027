import {CONFERENCE} from '@/lib/site-content';
import './globals.css';
import {Inter, Source_Serif_4} from 'next/font/google';
import {ToastProvider} from '@/components/ToastProvider';
import type { Metadata, Viewport } from 'next';

// Self-hosted at build time by next/font (no render-blocking third-party stylesheet).
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '600', '700'], style: ['normal', 'italic'], variable: '--font-serif-face', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans-face', display: 'swap' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://akure-humboldt-kolleg-2027.vercel.app';
const isPublic = process.env.SITE_PUBLIC === 'true';
const title = `${CONFERENCE.name} — ${CONFERENCE.theme}`;
const description = 'A Humboldt Kolleg hosted by the Federal University of Technology, Akure (FUTA), 15–18 March 2027. Five scientific sub-themes. Free participation.';

export const metadata: Metadata = {
  title: { default: title, template: '%s — Akure Humboldt Kolleg 2027' },
  description,
  metadataBase: new URL(baseUrl),
  openGraph: {
    title, description, type: 'website', siteName: 'Akure Humboldt Kolleg 2027', locale: 'en_NG',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${CONFERENCE.name} — ${CONFERENCE.theme}` }]
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
  robots: { index: isPublic, follow: isPublic }
};

export const viewport: Viewport = { themeColor: '#123528', colorScheme: 'light' };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en-GB" className={`${serif.variable} ${sans.variable}`}>
    <body><ToastProvider>{children}</ToastProvider></body>
  </html>;
}
