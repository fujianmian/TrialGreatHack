// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove or fix invalid keys like 'serverActions' and 'api'
  // Example of valid config:
  experimental: {
    // Only include if supported in your version
    // serverActions: true,
  },
};

export default nextConfig;