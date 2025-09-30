// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // serverActions: true, // keep this only if needed
  },
  eslint: {
    ignoreDuringBuilds: true, // ignore ESLint errors during build
  },
  async headers() {
    return [
      {
        // Match the root HTML page
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Match all other HTML pages
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
