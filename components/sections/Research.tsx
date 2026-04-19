import { ExternalLink, FileText, Github } from "lucide-react";

import type { Publication } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

interface ResearchProps {
  publications: Publication[];
  locale: Locale;
}

export function Research({ publications, locale }: ResearchProps) {
  if (publications.length === 0) {
    return null;
  }

  const dict = getDictionary(locale).research;

  return (
    <section
      id="research"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-5 w-5 text-accent" />
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
      </div>
      <div className="space-y-4">
        {publications.map((item) => (
          <article
            key={item.slug}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="text-xs uppercase tracking-[0.12em] text-accent">
                {item.venue} · {item.year}
              </p>
            </div>
            <p className="mb-3 text-sm leading-6 text-muted">{item.summary}</p>
            <ul className="mb-4 list-disc space-y-1 pl-4 text-sm text-muted">
              {item.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              {item.links.paper ? (
                <a
                  href={item.links.paper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {dict.readPaper}
                </a>
              ) : null}
              {item.links.code ? (
                <a
                  href={item.links.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs text-muted transition hover:bg-surface"
                >
                  <Github className="h-3.5 w-3.5" />
                  {dict.code}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
