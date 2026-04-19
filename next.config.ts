import type { NextConfig } from "next";

const configuredDistDir = process.env.NEXT_DIST_DIR?.trim();
const defaultDistDir = process.env.NODE_ENV === "development" ? ".next-dev" : ".next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://portfolio-sooty-three-22.vercel.app",
  },
  distDir:
    configuredDistDir && configuredDistDir.length > 0
      ? configuredDistDir
      : defaultDistDir,
};

export default nextConfig;
