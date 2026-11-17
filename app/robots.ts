import type {MetadataRoute} from 'next';

export default function robots(): MetadataRoute.Robots {
  const isPublic = process.env.SITE_PUBLIC === 'true';
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: isPublic
      ? {userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/', '/auth/', '/login', '/prototype.html']}
      : {userAgent: '*', disallow: '/'},
    sitemap: isPublic ? base + '/sitemap.xml' : undefined
  };
}
