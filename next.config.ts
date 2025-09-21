/** @type {import('next').NextConfig} */
const nextConfig = {
  
  serverActions: {
    bodySizeLimit: '10mb', // For Server Actions
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb', // For API routes like /api/extract
    },
  },
};

module.exports = nextConfig;