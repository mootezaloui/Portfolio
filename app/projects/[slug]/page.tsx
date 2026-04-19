import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Github } from "lucide-react";

import { getProjectBySlug, getPublicProjects } from "@/lib/content/loader";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/getLocale";
import {
  buildLensFitSummary,
  getLensFromSearchParams,
  getRoleLensDefinition,
} from "@/lib/lens/roleLens";
import { buildHomeTabHref } from "@/lib/navigation/homeTabs";
import { buildProjectJsonLd } from "@/lib/agents/profile";
import { ProjectHeroImage } from "@/components/projects/ProjectHeroImage";

const isPagesBuild = process.env.GITHUB_PAGES === "true";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lens?: string | string[] }>;
}

export async function generateStaticParams() {
  const projects = getPublicProjects("en");
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const project = getProjectBySlug(slug, locale);

  if (!project || project.visibility !== "public") {
    return {
      title: "Project",
    };
  }

  const previewImage = project.images[0] ?? "/avatar.png";

  return {
    title: project.title,
    description: project.shortSummary,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: project.title,
      description: project.shortSummary,
      url: `/projects/${project.slug}`,
      type: "article",
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
  };
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { slug } = await params;
  const lens = getLensFromSearchParams(isPagesBuild ? {} : await searchParams);
  const locale = await getLocale();
  const lensDefinition = getRoleLensDefinition(lens, locale);
  const project = getProjectBySlug(slug, locale);

  if (!project || project.visibility !== "public") {
    notFound();
  }

  const dict = getDictionary(locale).projects;
  const structuredData = buildProjectJsonLd(project);
  const fitSummary = buildLensFitSummary(project, lens, locale);

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-6 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Link
        href={buildHomeTabHref("projects", lens) as Route}
        className="border-border text-muted hover:bg-background hover:text-foreground mb-6 inline-flex rounded-full border px-3 py-1.5 text-xs transition"
      >
        {dict.backToProjects}
      </Link>
      <article
        className="border-border bg-surface overflow-hidden rounded-3xl border"
        data-mascot-anchor="project_primary_case_page"
      >
        <ProjectHeroImage images={project.images} title={project.title} />
        <div className="p-8">
          <p className="text-accent mb-2 text-xs font-semibold tracking-[0.2em] uppercase">
            {project.status} · {project.period}
          </p>
          {lens !== "general" ? (
            <p className="text-muted mb-2 text-xs">
              {formatMessage(dict.viewingThrough, {
                role: lensDefinition.label,
              })}
            </p>
          ) : null}
          <h1 className="mb-4 text-3xl font-semibold">{project.title}</h1>
          <p className="text-muted mb-6 leading-7">{project.longSummary}</p>
          {fitSummary ? (
            <p className="text-accent mb-6 text-sm">{fitSummary}</p>
          ) : null}
          <div className="mb-6 flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <span
                key={tech}
                className="border-border bg-background text-muted rounded-full border px-2.5 py-1 text-xs"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <section className="border-border bg-background rounded-2xl border p-5">
              <h2 className="text-accent mb-3 text-sm font-semibold tracking-[0.12em] uppercase">
                {dict.keyFeatures}
              </h2>
              <ul className="text-muted list-disc space-y-1.5 pl-4 text-sm">
                {project.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </section>
            <section className="border-border bg-background rounded-2xl border p-5">
              <h2 className="text-accent mb-3 text-sm font-semibold tracking-[0.12em] uppercase">
                {dict.outcomes}
              </h2>
              <ul className="text-muted list-disc space-y-1.5 pl-4 text-sm">
                {project.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </section>
          </div>
          <section className="border-border bg-background mb-6 rounded-2xl border p-5">
            <h2 className="text-accent mb-3 text-sm font-semibold tracking-[0.12em] uppercase">
              {dict.technicalDetails}
            </h2>
            <p className="text-muted text-sm leading-7">
              {project.technicalDetails}
            </p>
          </section>
          <div className="flex flex-wrap gap-2">
            {project.links.github ? (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-muted hover:bg-background hover:text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition"
              >
                <Github className="h-4 w-4" />
                {dict.sourceCode}
              </a>
            ) : null}
            {project.links.demo ? (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-muted hover:bg-background hover:text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition"
              >
                <ExternalLink className="h-4 w-4" />
                {dict.demoPublication}
              </a>
            ) : null}
          </div>
        </div>
      </article>
    </main>
  );
}
