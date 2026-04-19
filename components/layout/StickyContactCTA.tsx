import { Mail } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { RoleLens } from "@/lib/lens/roleLens";
import { buildHomeTabHref } from "@/lib/navigation/homeTabs";

interface StickyContactCTAProps {
  lens: RoleLens;
  locale: Locale;
}

export function StickyContactCTA({ lens, locale }: StickyContactCTAProps) {
  const dict = getDictionary(locale).stickyCta;
  return (
    <a
      href={buildHomeTabHref("contact", lens)}
      aria-label={dict.ariaLabel}
      className="fixed right-5 top-20 z-40 hidden items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-[var(--shadow-floating)] transition hover:opacity-90 md:inline-flex"
    >
      <Mail className="h-3.5 w-3.5" />
      {dict.label}
    </a>
  );
}
