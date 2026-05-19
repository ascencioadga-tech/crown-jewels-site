import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Full static export — emits plain HTML files to /out, served directly by
  // any static host. Avoids the Netlify Next.js runtime entirely.
  // All routes in this app are static-prerendered, so nothing is lost.
  output: "export",
  // Required by `output: export` and also fixes the missing-logo issue.
  images: {
    unoptimized: true,
  },
  // /dashboard → /dashboard/index.html (clean URLs)
  trailingSlash: true,
};

export default nextConfig;
