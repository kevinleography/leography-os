/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
