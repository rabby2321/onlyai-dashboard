// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don’t fail the build because of ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don’t fail the build because of TS type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
