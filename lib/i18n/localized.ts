import { z } from "zod";

import type { Locale } from "./config";

export const localizedStringSchema = z.union([
  z.string().min(1),
  z.object({
    en: z.string().min(1),
    fr: z.string().min(1),
  }),
]);

export type LocalizedString = z.infer<typeof localizedStringSchema>;

export const localizedStringArraySchema = z.array(localizedStringSchema).min(1);

export function pickLocalized(value: LocalizedString, locale: Locale): string {
  if (typeof value === "string") return value;
  return value[locale] ?? value.en;
}

export function pickLocalizedArray(
  values: readonly LocalizedString[],
  locale: Locale
): string[] {
  return values.map((value) => pickLocalized(value, locale));
}

export function pickLocalizedOptional(
  value: LocalizedString | undefined,
  locale: Locale
): string | undefined {
  if (value === undefined) return undefined;
  return pickLocalized(value, locale);
}
