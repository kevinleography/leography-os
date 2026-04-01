/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.leography.fr',
      },
      {
        protocol: 'https',
        hostname: 'leography.fr',
      },
    ],
  },
};

export default nextConfig;
