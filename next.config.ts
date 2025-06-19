import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactProductionProfiling: true,
  images: {
    remotePatterns: [
      new URL("https://images.unsplash.com/**"),
    ]
  },
};

export default nextConfig;
