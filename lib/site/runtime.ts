export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://portfolio-sooty-three-22.vercel.app";

function isExternalPath(path: string): boolean {
  return (
    /^[a-z]+:\/\//i.test(path) ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  );
}

export function withBasePath(path: string): string {
  if (!path || isExternalPath(path)) {
    return path;
  }
  return path;
}

export function toAbsoluteUrl(path: string): string {
  return new URL(withBasePath(path), SITE_URL).toString();
}
