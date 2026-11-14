import './globals.css';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://akure-humboldt-kolleg-2027.vercel.app';
const isPublic = process.env.SITE_PUBLIC === 'true';
const title = 'Akure Humboldt Kolleg 2027 — Biodiversity, Climate Change and Food Security';
const description = 'A proposed Humboldt Kolleg hosted by the Federal University of Technology, Akure, 22–25 February 2027. Five scientific sub-themes. Free participation.';

export const metadata: Metadata = {
  title: { default: title, template: '%s — Akure Humboldt Kolleg 2027' },
  description,
  metadataBase: new URL(baseUrl),
  alternates: { canonical: '/' },
  openGraph: {
    title, description, type: 'website', url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Akure Humboldt Kolleg 2027: Biodiversity, Climate Change and Food Security' }]
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
  robots: { index: isPublic, follow: isPublic }
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet"/>
    </head>
    <body>{children}</body>
  </html>;
}
