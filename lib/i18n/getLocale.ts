import { cache } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  parseAcceptLanguage,
  resolveLocale,
  type Locale,
} from "./config";

const isPagesBuild = process.env.GITHUB_PAGES === "true";

export const getLocale = cache(async (): Promise<Locale> => {
  if (isPagesBuild) {
    return DEFAULT_LOCALE;
  }

  const { cookies, headers } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieValue) {
    return resolveLocale(cookieValue);
  }

  const headerStore = await headers();
  const accept = headerStore.get("accept-language");
  if (accept) {
    return parseAcceptLanguage(accept);
  }

  return DEFAULT_LOCALE;
});
