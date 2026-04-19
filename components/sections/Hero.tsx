import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Github, Linkedin, MessageSquare } from "lucide-react";

import type { Profile } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import {
  buildLensHref,
  getRoleLensDefinition,
  type RoleLens,
} from "@/lib/lens/roleLens";
import { getResumeDownloadName, getResumeHref } from "@/lib/lens/resume";
import { buildHomeTabHref } from "@/lib/navigation/homeTabs";
import { withBasePath } from "@/lib/site/runtime";

interface HeroProps {
  profile: Profile;
  lens: RoleLens;
  locale: Locale;
}

export function Hero({ profile, lens, locale }: HeroProps) {
  const lensDefinition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).hero;
  const positioning = lensDefinition.positioning;

  return (
    <section
      id="overview"
      className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 lg:p-10"
      data-mascot-anchor="hero_primary"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--hero-orb)] blur-3xl" />
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="relative z-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            {profile.tagline} ·{" "}
            {formatMessage(dict.availableFor, {
              role: lensDefinition.shortLabel,
            })}
          </p>
          <h1 className="mb-4 text-3xl font-semibold leading-tight md:text-5xl">
            {profile.name}
          </h1>
          <p className="mb-6 max-w-2xl text-lg leading-7 text-foreground">
            {positioning}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={buildHomeTabHref("why-me", lens) as Route}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              {dict.whyMe}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={buildLensHref("/twin", lens) as Route}
              data-mascot-anchor="twin_entry_button_hero"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
            >
              <MessageSquare className="h-4 w-4" />
              {dict.askAssistant}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted">
            <a
              href={getResumeHref(lens)}
              download={getResumeDownloadName(lens)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              {dict.resume}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={profile.contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              <Github className="h-3.5 w-3.5" />
              {dict.github}
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={profile.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              <Linkedin className="h-3.5 w-3.5" />
              {dict.linkedin}
            </a>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center lg:justify-end">
          <div className="relative h-56 w-56 overflow-hidden rounded-[2rem] border border-border bg-background shadow-[var(--shadow-elevated)]">
            <Image
              src={withBasePath("/avatar.png")}
              alt={formatMessage(dict.avatarAlt, { name: profile.name })}
              fill
              sizes="224px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <ul className="mt-10 grid gap-4 border-t border-border pt-6 md:grid-cols-3">
        {dict.proofPoints.map((point) => (
          <li key={point.label} className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">{point.label}</p>
            <p className="text-xs leading-5 text-muted">{point.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
