import type { NextConfig } from "next";

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL!
  .replace('https://','')
  .split('/')[0]
const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable experimental features if needed
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
  // Ensure proper handling of Vercel Analytics and Speed Insights
  // headers: async () => {
  //   return [
  //     {
  //       source: '/_vercel/speed-insights/script.js',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=31536000, immutable',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
