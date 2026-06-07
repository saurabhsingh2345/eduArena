import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mongoose', 'ioredis'],
  turbopack: {},
};

export default nextConfig;
