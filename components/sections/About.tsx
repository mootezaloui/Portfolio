import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Target, Wrench, Zap } from "lucide-react";

import type { Profile } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import {
  buildLensHref,
  getRoleLensDefinition,
  type RoleLens,
} from "@/lib/lens/roleLens";

interface AboutProps {
  profile: Profile;
  lens: RoleLens;
  locale: Locale;
}

export function About({ profile, lens, locale }: AboutProps) {
  const lensDefinition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).about;

  return (
    <section
      id="why-me"
      data-mascot-anchor="section_about"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Compass className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-semibold">{dict.title}</h2>
        </div>
        <p className="text-xs text-muted">
          {formatMessage(dict.framedFor, {
            role: lensDefinition.label.toLowerCase(),
          })}
        </p>
      </div>

      <p className="max-w-3xl text-lg leading-8 text-foreground">
        {lensDefinition.positioning}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-background p-5">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-accent" />
            {dict.whatIBuild}
          </p>
          <p className="text-sm leading-6 text-muted">
            {lensDefinition.whatIBuild}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-background p-5">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap className="h-4 w-4 text-accent" />
            {dict.whatMakesDifferent}
          </p>
          <p className="text-sm leading-6 text-muted">
            {lensDefinition.whatMakesMeDifferent}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-background p-5 md:col-span-2">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-accent" />
            {dict.rolesITarget}
          </p>
          <ul className="flex flex-wrap gap-2">
            {lensDefinition.targetRoles.map((role) => (
              <li
                key={role}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground"
              >
                {role}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            {profile.identity.availability}{" "}
            {formatMessage(dict.basedIn, {
              location: profile.identity.location ?? "",
            })}
          </p>
        </article>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
        <p className="text-sm text-muted">{dict.hiringCta}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${profile.contact.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
          >
            {dict.emailMe}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <Link
            href={buildLensHref("/twin", lens) as Route}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-surface"
          >
            {dict.askAssistant}
          </Link>
        </div>
      </div>
    </section>
  );
}
