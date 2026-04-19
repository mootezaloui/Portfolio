import { GraduationCap } from "lucide-react";

import type { Education as EducationItem } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

interface EducationProps {
  education: EducationItem[];
  locale: Locale;
}

export function Education({ education, locale }: EducationProps) {
  if (education.length === 0) {
    return null;
  }

  const dict = getDictionary(locale).education;

  return (
    <section
      id="education"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-6 flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-accent" />
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
      </div>
      <div className="space-y-4">
        {education.map((item) => (
          <article
            key={item.slug}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{item.institution}</h3>
              <p className="text-xs uppercase tracking-[0.12em] text-accent">
                {item.period}
              </p>
            </div>
            <p className="mb-3 text-sm text-muted">
              {item.degree}
              {item.specialization ? ` — ${item.specialization}` : ""} ·{" "}
              {item.location}
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
              {item.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
