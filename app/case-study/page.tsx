import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import {
  getExperiences,
  getProfile,
  getPublicProjects,
  getSkillCategories,
} from "@/lib/content/loader";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/getLocale";
import {
  buildLensHref,
  getLensFromSearchParams,
  getRoleLensDefinition,
} from "@/lib/lens/roleLens";
import { withBasePath } from "@/lib/site/runtime";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale).caseStudy;
  return {
    title: dict.metaTitle,
    description: dict.metaDescription,
    alternates: {
      canonical: withBasePath("/case-study"),
    },
    openGraph: {
      title: dict.ogTitle,
      description: dict.ogDescription,
      url: withBasePath("/case-study"),
      images: [
        {
          url: withBasePath("/avatar.png"),
          width: 1200,
          height: 1200,
          alt: `${dict.ogTitle} preview`,
        },
      ],
    },
  };
}

const runtimeOverviewDiagram = `
Incoming Request
      |
      v
Edge Middleware (Agent Detection)
      |
  +---+-----------------------------+
  |                                 |
Human Browser                   Scraping Agent
  |                                 |
  v                                 v
App Router                      /agent Routes
  |                                 |
  +-----> Landing + Twin UI         +-----> profile.json / projects.json / verdict.json / llms.txt
               |
               v
         /api/twin/chat
               |
      classify -> retrieve -> prompt -> provider -> validate -> return
`.trim();

const twinPolicyDiagram = `
User Message
    |
    v
[Layer 1] Prompt Scope Contract
    |
    v
[Layer 2] Pre-call Classifier
  - in_scope      -> continue
  - out_of_scope  -> deflect, no LLM call
  - ambiguous     -> fallback classifier path
    |
    v
[Layer 3] Post-call Validator
  - pass -> return answer
  - fail -> replace with scoped deflection
`.trim();

const agentRoutingDiagram = `
Request -> middleware.ts
    |
    +-> Known agent signatures? (GPTBot, ClaudeBot, PerplexityBot, BingBot, ...)
    |       yes -> confidence high -> rewrite to /agent
    |
    +-> Explicit self-identification? (/agent path or ?agent=1)
    |       yes -> confidence high -> rewrite to /agent
    |
    +-> Behavioral hints (headers/cookies/fetch hints)
            medium confidence -> keep human page + detection headers
            low confidence    -> normal human experience
`.trim();

interface CaseStudyPageProps {
  searchParams: Promise<{ lens?: string | string[] }>;
}

export default async function CaseStudyPage({ searchParams }: CaseStudyPageProps) {
  const lens = getLensFromSearchParams(await searchParams);
  const locale = await getLocale();
  const lensDefinition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).caseStudy;
  const profile = getProfile(locale);
  const projects = getPublicProjects(locale);
  const experiences = getExperiences(locale);
  const skillCategories = getSkillCategories(locale);

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8 rounded-3xl border border-border bg-surface p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {dict.headerTag}
        </p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          {dict.headerTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
          {formatMessage(dict.headerIntro, { name: profile.name })}
        </p>
        {lens !== "general" ? (
          <p className="mt-3 text-xs text-muted">
            {formatMessage(dict.currentLens, { role: lensDefinition.label })}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full border border-border bg-background px-3 py-1">
            {formatMessage(dict.publicSystems, { count: projects.length })}
          </span>
          <span className="rounded-full border border-border bg-background px-3 py-1">
            {formatMessage(dict.experienceRecords, {
              count: experiences.length,
            })}
          </span>
          <span className="rounded-full border border-border bg-background px-3 py-1">
            {formatMessage(dict.skillDomains, {
              count: skillCategories.length,
            })}
          </span>
        </div>
      </header>

      <section className="mb-8 rounded-3xl border border-border bg-surface p-8">
        <h2 className="mb-3 text-2xl font-semibold">{dict.systemOverviewTitle}</h2>
        <p className="mb-4 text-sm leading-7 text-muted">
          {dict.systemOverviewBody}
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-border bg-background p-4 text-xs leading-6 text-muted">
          <code>{runtimeOverviewDiagram}</code>
        </pre>
      </section>

      <section className="mb-8 rounded-3xl border border-border bg-surface p-8">
        <h2 className="mb-3 text-2xl font-semibold">{dict.twinControlsTitle}</h2>
        <p className="mb-4 text-sm leading-7 text-muted">
          {dict.twinControlsBody}
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-border bg-background p-4 text-xs leading-6 text-muted">
          <code>{twinPolicyDiagram}</code>
        </pre>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted">
          {dict.twinBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-3xl border border-border bg-surface p-8">
        <h2 className="mb-3 text-2xl font-semibold">{dict.agentGauntletTitle}</h2>
        <p className="mb-4 text-sm leading-7 text-muted">
          {dict.agentGauntletBody}
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-border bg-background p-4 text-xs leading-6 text-muted">
          <code>{agentRoutingDiagram}</code>
        </pre>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href={buildLensHref("/agent/profile.json", lens) as Route}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
          >
            `/agent/profile.json`
          </Link>
          <Link
            href={buildLensHref("/agent/projects.json", lens) as Route}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
          >
            `/agent/projects.json`
          </Link>
          <Link
            href={buildLensHref("/agent/verdict.json", lens) as Route}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
          >
            `/agent/verdict.json`
          </Link>
          <Link
            href={buildLensHref("/llms.txt", lens) as Route}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
          >
            `/llms.txt`
          </Link>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-border bg-surface p-8">
        <h2 className="mb-3 text-2xl font-semibold">{dict.failureModesTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-background p-5">
            <h3 className="mb-2 text-base font-semibold">
              {dict.failurePromptDriftTitle}
            </h3>
            <p className="text-sm leading-6 text-muted">
              {dict.failurePromptDriftBody}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5">
            <h3 className="mb-2 text-base font-semibold">
              {dict.failureAgentMisTitle}
            </h3>
            <p className="text-sm leading-6 text-muted">
              {dict.failureAgentMisBody}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5">
            <h3 className="mb-2 text-base font-semibold">
              {dict.failureProviderTitle}
            </h3>
            <p className="text-sm leading-6 text-muted">
              {dict.failureProviderBody}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5">
            <h3 className="mb-2 text-base font-semibold">
              {dict.failureLowSignalTitle}
            </h3>
            <p className="text-sm leading-6 text-muted">
              {dict.failureLowSignalBody}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-8">
        <h2 className="mb-3 text-2xl font-semibold">{dict.inspectionTitle}</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>
            {dict.inspectionTwin}{" "}
            <Link href={buildLensHref("/twin", lens) as Route} className="underline">
              /twin
            </Link>
          </li>
          <li>
            {dict.inspectionAgent}{" "}
            <Link href={buildLensHref("/agent", lens) as Route} className="underline">
              /agent
            </Link>
          </li>
          <li>
            {dict.inspectionHuman}{" "}
            <Link href={buildLensHref("/", lens) as Route} className="underline">
              /
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
