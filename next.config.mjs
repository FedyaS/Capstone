/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // AI dumps pasted into the scratchpad can be large.
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
