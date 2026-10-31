const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Next 16 builds with Turbopack, which refuses imports above the app root;
  // status.config.ts lives one level up, so widen the root to the template.
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
