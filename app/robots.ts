import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots {return {rules:{userAgent:'*',...(process.env.SITE_PUBLIC==='true'?{allow:'/'}:{disallow:'/'})},sitemap:process.env.SITE_PUBLIC==='true'?(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000')+'/sitemap.xml':undefined};}
