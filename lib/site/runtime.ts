const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

function normalizeBasePath(value: string): string {
  if (!value || value === "/") {
    return "";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const SITE_BASE_PATH = normalizeBasePath(rawBasePath);
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tazou-runtime.vercel.app";

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

  if (!path.startsWith("/")) {
    return path;
  }

  if (!SITE_BASE_PATH) {
    return path;
  }

  if (path === SITE_BASE_PATH || path.startsWith(`${SITE_BASE_PATH}/`)) {
    return path;
  }

  return `${SITE_BASE_PATH}${path}`;
}

export function toAbsoluteUrl(path: string): string {
  return new URL(withBasePath(path), SITE_URL).toString();
}
