import Link from "next/link";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear();
  const dict = getDictionary(locale).footer;

  return (
    <footer className="mx-auto mt-8 w-full max-w-6xl border-t border-border px-6 pb-10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <p>{dict.motto}</p>
          <Link
            href="/case-study"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {dict.howItWorks}
          </Link>
        </div>
        <p>{year} · Mootez Aloui</p>
      </div>
    </footer>
  );
}
