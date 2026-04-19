import { FlaskConical } from "lucide-react";

import type { Experience } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

interface BetaProgramsProps {
  programs: Experience[];
  locale: Locale;
}

export function BetaPrograms({ programs, locale }: BetaProgramsProps) {
  if (programs.length === 0) {
    return null;
  }

  const dict = getDictionary(locale).betaPrograms;

  return (
    <section
      id="beta-programs"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-2 flex items-center gap-3">
        <FlaskConical className="h-5 w-5 text-accent" />
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-muted">{dict.description}</p>
      <ul className="grid gap-3 md:grid-cols-3">
        {programs.map((program) => (
          <li
            key={program.slug}
            className="rounded-2xl border border-border bg-background p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              {program.company}
            </p>
            <p className="mt-0.5 text-xs text-muted">{program.title}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-accent">
              {program.period}
            </p>
            <p className="mt-3 text-xs leading-5 text-muted">{program.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
