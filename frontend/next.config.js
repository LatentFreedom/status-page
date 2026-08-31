/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    // status.config.ts lives at the repo root, one level above this app.
    externalDir: true,
  },
};

module.exports = nextConfig;
