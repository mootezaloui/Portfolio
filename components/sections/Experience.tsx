import { ArrowRight, Mail } from "lucide-react";

import type { Experience as ExperienceItem, Profile } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import { getRoleLensDefinition, type RoleLens } from "@/lib/lens/roleLens";

interface ExperienceProps {
  experiences: ExperienceItem[];
  lens: RoleLens;
  locale: Locale;
  profile?: Profile;
  id?: string;
  title?: string;
  description?: string;
  showLensNote?: boolean;
  showCta?: boolean;
}

export function Experience({
  experiences,
  lens,
  locale,
  profile,
  id = "experience",
  title,
  description,
  showLensNote = true,
  showCta = true,
}: ExperienceProps) {
  if (experiences.length === 0) {
    return null;
  }

  const lensDefinition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).experience;
  const resolvedTitle = title ?? dict.title;

  return (
    <section
      id={id}
      data-mascot-anchor="section_experience"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold">{resolvedTitle}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {showLensNote ? (
          <p className="text-xs text-muted">
            {formatMessage(dict.emphasizedFor, {
              role: lensDefinition.shortLabel,
            })}
          </p>
        ) : null}
      </div>
      <ol className="relative ml-2 space-y-8 border-l border-border pl-6">
        {experiences.map((item) => (
          <li
            key={item.slug}
            className="relative"
          >
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-background"
            />
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm font-medium text-accent">
                  {item.company}
                </p>
              </div>
              <p className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {item.period}
              </p>
            </div>
            <p className="mb-3 text-xs text-muted">
              {item.type} · {item.location}
            </p>
            <p className="mb-3 text-sm leading-6 text-foreground/85">
              {item.summary}
            </p>
            {item.achievements.length > 0 ? (
              <ul className="mb-4 space-y-1.5 text-sm leading-6 text-muted">
                {item.achievements.map((achievement) => (
                  <li key={achievement} className="relative pl-4">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[0.6rem] h-1 w-1 rounded-full bg-accent"
                    />
                    {achievement}
                  </li>
                ))}
              </ul>
            ) : null}
            {item.technologies.length > 0 ? (
              <div
                className="flex flex-wrap gap-1.5"
                aria-label={formatMessage(dict.tech, {
                  list: item.technologies.join(", "),
                })}
              >
                {item.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {showCta && profile ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
          <p className="text-sm text-muted">{dict.fitsRole}</p>
          <a
            href={`mailto:${profile.contact.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <Mail className="h-3.5 w-3.5" />
            {dict.getInTouch}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : null}
    </section>
  );
}
