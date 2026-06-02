import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(appRoot, '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: appRoot,
  outputFileTracingExcludes: {
    '/*': ['./data/atlas-intake/**/*']
  },
  async redirects() {
    return [
      {
        source: '/Atlas',
        destination: '/atlas',
        permanent: true
      }
    ];
  },
  turbopack: {
    root: appRoot
  }
};

export default nextConfig;
