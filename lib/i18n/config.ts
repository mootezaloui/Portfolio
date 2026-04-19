export const LOCALES = ["en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "tazou-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const trimmed = value.trim().toLowerCase();
  if (isLocale(trimmed)) return trimmed;
  const short = trimmed.split(/[-_]/)[0];
  if (isLocale(short)) return short;
  return DEFAULT_LOCALE;
}

export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const entries = header
    .split(",")
    .map((part) => {
      const [rawTag = "", ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const qRaw = qParam?.split("=")[1];
      const q = qRaw ? parseFloat(qRaw) : 1;
      return { tag: rawTag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const entry of entries) {
    const short = entry.tag.split(/[-_]/)[0] ?? "";
    if (isLocale(short)) return short;
  }
  return DEFAULT_LOCALE;
}
