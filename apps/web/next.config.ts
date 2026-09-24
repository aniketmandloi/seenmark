import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

const withVarlock = varlockNextConfigPlugin();

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  // Vercel Services deployments don't wire up the /_next/image optimizer, so
  // images are served as-is.
  images: {
    unoptimized: true,
  },
};

export default withVarlock(nextConfig);
