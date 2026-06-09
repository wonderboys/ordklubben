import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/ladder", destination: "/stegvis", permanent: true },
      { source: "/connections", destination: "/dagens-ord", permanent: true },
      { source: "/ordkod", destination: "/dagens-ord", permanent: true },
    ];
  },
  // Allow LAN testing from phones/tablets in dev (Next.js blocks /_next otherwise).
  allowedDevOrigins: [
    "10.0.1.5",
    "192.168.1.113",
    "192.168.*",
    "10.*",
    "172.*",
  ],
};

export default nextConfig;
