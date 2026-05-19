import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip /_next/image optimization so <Image> renders a plain <img> tag.
  // We only have a logo + video, so we don't need responsive size generation —
  // and this avoids the broken-image issue on Netlify deploys.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
