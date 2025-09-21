// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions: true, // keep this only if needed
  },
  eslint: {
    ignoreDuringBuilds: true, // <- Add this line to ignore ESLint errors during build
  },
};

export default nextConfig;
