import type { NextConfig } from "next";

// When deploying to GitHub Pages the site lives at /<repo>/
// Set NEXT_PUBLIC_BASE_PATH=/status-site in the CI env (see .github/workflows/deploy.yml).
// Leave it unset for local dev so http://localhost:3000 works without a sub-path.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",          // static HTML/CSS/JS — required for GitHub Pages
  basePath,                  // e.g. /status-site
  assetPrefix: basePath,     // prefix for _next/* assets
  images: {
    unoptimized: true,       // next/image optimization is unavailable in static export
  },
  // Ensure the correct workspace root is used in nested folders (Windows paths with spaces, etc.)
  // Prevents Turbopack from picking a higher-level lockfile as the monorepo root.
  turbopack: {
    // Use the directory containing this config as the root.
    root: __dirname,
  },
};

export default nextConfig;
