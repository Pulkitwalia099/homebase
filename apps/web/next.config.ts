import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js that this app's root is apps/web, not the monorepo root.
  // Silences the "multiple lockfiles detected" warning.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
