import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Without this, Turbopack picks /Users/peppe/package-lock.json as the workspace
    // root and watches/resolves a huge parent tree — dev becomes extremely slow.
    root: projectRoot,
  },
  async redirects() {
    return [
      { source: '/ladder', destination: '/stegvis', permanent: true },
      { source: '/connections', destination: '/dagens-ord', permanent: true },
      { source: '/ordkod', destination: '/dagens-ord', permanent: true },
    ];
  },
  // Allow LAN testing from phones/tablets in dev (Next.js blocks /_next otherwise).
  allowedDevOrigins: ['10.0.1.5', '192.168.1.113', '192.168.*', '10.*', '172.*'],
};

export default nextConfig;
