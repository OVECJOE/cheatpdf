import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactProductionProfiling: true,
  images: {
    remotePatterns: [
      new URL("https://images.unsplash.com/**"),
    ]
  },
  serverExternalPackages: ['pdf-parse', 'tesseract.js'],
  // Configure for large file uploads
  async headers() {
    return [
      {
        source: '/api/documents',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
