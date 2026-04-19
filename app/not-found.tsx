import type { Route } from "next";
import Link from "next/link";

import { getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/getLocale";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale).notFound;

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-12"
    >
      <section className="w-full rounded-3xl border border-border bg-surface p-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {dict.tag}
        </p>
        <h1 className="mb-3 text-3xl font-semibold">{dict.title}</h1>
        <p className="mx-auto mb-6 max-w-xl text-sm leading-7 text-muted">
          {dict.body}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={"/" as Route}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            {dict.home}
          </Link>
          <Link
            href={"/twin" as Route}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:bg-background hover:text-foreground"
          >
            {dict.twin}
          </Link>
          <Link
            href={"/case-study" as Route}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:bg-background hover:text-foreground"
          >
            {dict.caseStudy}
          </Link>
        </div>
      </section>
    </main>
  );
}
