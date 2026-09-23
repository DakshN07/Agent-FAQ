import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The repository has two package.json files (root backend + this frontend).
  // Pin Turbopack to this directory so it does not treat the repo root's
  // package-lock.json as the workspace root during builds on Vercel.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;