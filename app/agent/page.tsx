import type { Metadata } from "next";
import { LensContextBanner } from "@/components/lens/LensContextBanner";
import { LensSelector } from "@/components/lens/LensSelector";
import {
  buildLensHref,
  getLensFromSearchParams,
  getRoleLensDefinition,
} from "@/lib/lens/roleLens";

import { buildAgentLandingSections, buildAgentVerdict } from "@/lib/agents/profile";

export const metadata: Metadata = {
  title: "Agent Gauntlet",
  description:
    "Machine-readable candidate summary endpoint for AI crawlers and recruiter-side agent evaluation.",
  alternates: {
    canonical: "/agent",
  },
};

const isPagesBuild = process.env.GITHUB_PAGES === "true";

interface AgentPageProps {
  searchParams: Promise<{ lens?: string | string[] }>;
}

export default async function AgentPage({ searchParams }: AgentPageProps) {
  const lens = getLensFromSearchParams(isPagesBuild ? {} : await searchParams);
  const lensDefinition = getRoleLensDefinition(lens, "en");
  const { profile, projects, certifications } = buildAgentLandingSections(lens);
  const verdict = buildAgentVerdict(lens);

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 border-b border-border pb-5">
        <h1 className="text-3xl font-semibold">Agent Gauntlet: Candidate Summary</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          This page is intentionally optimized for machine parsing. It mirrors public
          portfolio evidence in concise, summarization-friendly sections.
        </p>
      </header>
      <div className="mb-8 space-y-4">
        <LensSelector currentLens={lens} basePath="/agent" locale="en" />
        <LensContextBanner lens={lens} locale="en" />
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Canonical Summary</h2>
        <p className="text-sm leading-7 text-muted">{profile.summary}</p>
        <p className="mt-2 text-xs text-muted">
          Active lens for this page: {lensDefinition.label}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Primary Endpoints</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>{buildLensHref("/agent/profile.json", lens)}</li>
          <li>{buildLensHref("/agent/projects.json", lens)}</li>
          <li>{buildLensHref("/agent/verdict.json", lens)}</li>
          <li>{buildLensHref("/llms.txt", lens)}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Key Strength Signals</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          {profile.strengths.map((strength) => (
            <li key={strength}>{strength}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Selected Projects</h2>
        <div className="space-y-4">
          {projects.projects.slice(0, 5).map((project) => (
            <article key={project.slug} className="rounded-xl border border-border p-4">
              <h3 className="text-base font-semibold">{project.title}</h3>
              <p className="mt-1 text-sm text-muted">{project.shortSummary}</p>
              <p className="mt-2 text-xs text-muted">
                {project.period} · {project.status}
              </p>
              <p className="mt-2 text-xs text-muted">Tech: {project.tech.join(", ")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                {project.outcomes.slice(0, 2).map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Experience Highlights</h2>
        <div className="space-y-4">
          {profile.experienceHighlights.map((experience) => (
            <article key={`${experience.company}-${experience.period}`}>
              <h3 className="text-base font-semibold">
                {experience.title} · {experience.company}
              </h3>
              <p className="text-xs text-muted">{experience.period}</p>
              <p className="mt-1 text-sm text-muted">{experience.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Certifications Snapshot</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          {certifications.map((certification) => (
            <li key={`${certification.title}-${certification.date}`}>
              {certification.title} ({certification.issuer}, {certification.date})
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-2 text-lg font-semibold">Draft Evaluator Verdict</h2>
        <p className="text-sm leading-7 text-muted">{verdict.recommendedSummary}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
          {verdict.keyStrengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-accent">
          Status: {verdict.status}
        </p>
      </section>
    </main>
  );
}
