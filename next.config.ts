// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // serverActions: true, // keep this only if needed
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Fix for pdfkit and canvas issues
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "worker-src 'self' blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;