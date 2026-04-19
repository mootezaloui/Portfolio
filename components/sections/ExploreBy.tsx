import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, FileCode2, MessageSquare, Microscope, Timer } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { buildLensHref, type RoleLens } from "@/lib/lens/roleLens";
import { buildHomeTabHref } from "@/lib/navigation/homeTabs";

interface ExploreByProps {
  lens: RoleLens;
  locale: Locale;
}

export function ExploreBy({ lens, locale }: ExploreByProps) {
  const dict = getDictionary(locale).exploreBy;
  const paths = [
    {
      title: dict.fastOverviewTitle,
      subtitle: dict.fastOverviewSubtitle,
      description: dict.fastOverviewDescription,
      icon: Timer,
      href: buildHomeTabHref("why-me", lens),
      cta: dict.fastOverviewCta,
      external: false as const,
    },
    {
      title: dict.deepDiveTitle,
      subtitle: dict.deepDiveSubtitle,
      description: dict.deepDiveDescription,
      icon: Microscope,
      href: buildHomeTabHref("projects", lens),
      cta: dict.deepDiveCta,
      external: false as const,
    },
    {
      title: dict.assistantTitle,
      subtitle: dict.assistantSubtitle,
      description: dict.assistantDescription,
      icon: MessageSquare,
      href: buildLensHref("/twin", lens),
      cta: dict.assistantCta,
      external: true as const,
    },
  ];

  return (
    <section
      id="explore"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
      aria-label={dict.title}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{dict.title}</h2>
          <p className="mt-1 text-sm text-muted">{dict.description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {paths.map((path) => {
          const Icon = path.icon;
          const cardClasses =
            "group flex h-full flex-col justify-between rounded-2xl border border-border bg-background p-5 transition hover:border-accent";

          const content = (
            <>
              <div>
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {path.subtitle}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {path.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {path.description}
                </p>
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                {path.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </>
          );

          if (path.external) {
            return (
              <Link
                key={path.title}
                href={path.href as Route}
                className={cardClasses}
              >
                {content}
              </Link>
            );
          }

          return (
            <a key={path.title} href={path.href} className={cardClasses}>
              {content}
            </a>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {dict.caseStudyTitle}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {dict.caseStudyDescription}
            </p>
          </div>
        </div>
        <Link
          href={"/case-study" as Route}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent"
        >
          {dict.caseStudyCta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
