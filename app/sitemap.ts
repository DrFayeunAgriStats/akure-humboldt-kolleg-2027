import type {MetadataRoute} from 'next';

const PUBLIC_PAGES = ['/', '/about', '/subthemes', '/venue', '/partners', '/participation', '/contact', '/programme', '/speakers', '/register', '/submit', '/abstracts', '/privacy'];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return PUBLIC_PAGES.map(path => ({url: base + path, changeFrequency: path === '/' ? 'weekly' : 'monthly', priority: path === '/' ? 1 : 0.7}));
}
