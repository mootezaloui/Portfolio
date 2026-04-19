import type { NextConfig } from "next";

const configuredDistDir = process.env.NEXT_DIST_DIR?.trim();
const defaultDistDir = process.env.NODE_ENV === "development" ? ".next-dev" : ".next";
const isPagesBuild = process.env.GITHUB_PAGES === "true";
const pagesBasePath = "/Portfolio";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: isPagesBuild ? pagesBasePath : "",
    NEXT_PUBLIC_STATIC_EXPORT: isPagesBuild ? "true" : "false",
    NEXT_PUBLIC_SITE_URL: isPagesBuild
      ? "https://mootezaloui.github.io"
      : "https://tazou-runtime.vercel.app",
  },
  ...(isPagesBuild
    ? {
        output: "export",
        basePath: pagesBasePath,
        assetPrefix: `${pagesBasePath}/`,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  distDir:
    configuredDistDir && configuredDistDir.length > 0
      ? configuredDistDir
      : defaultDistDir,
};

export default nextConfig;
