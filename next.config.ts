import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modelo de caché clásico (sin cacheComponents): unstable_cache + revalidateTag.
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
