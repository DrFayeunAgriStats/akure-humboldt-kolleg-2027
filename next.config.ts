import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/organiser/abstract-status': [
      './lib/fonts/*.ttf',
      './public/branding/futa-crest.png',
      './public/branding/avh-supported-by.png'
    ]
  }
};
export default nextConfig;
