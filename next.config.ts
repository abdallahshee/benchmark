import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Enables forbidden() / app/forbidden.tsx for role checks.
    authInterrupts: true,
    // Only bundle the Mantine components that are actually imported.
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "@mantine/dates"],
    // Avatar uploads go through a Server Action (2 MB max + multipart overhead).
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Pin the project root so Next.js doesn't look for lockfiles in parent folders.
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
