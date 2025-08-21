import type { NextConfig } from "next";

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL!
  .replace('https://','')
  .split('/')[0]
const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable experimental features if needed
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: SUPABASE_HOST, pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/u/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/a/**' },
      { protocol: 'https', hostname: 'pbs.twimg.com', pathname: '/profile_images/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
