import type { NextConfig } from "next";

const configuredDistDir = process.env.NEXT_DIST_DIR?.trim();
const defaultDistDir = process.env.NODE_ENV === "development" ? ".next-dev" : ".next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  distDir:
    configuredDistDir && configuredDistDir.length > 0
      ? configuredDistDir
      : defaultDistDir,
};

export default nextConfig;
