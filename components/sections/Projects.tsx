import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Github, Mail } from "lucide-react";

import type { Profile, Project } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import {
  buildLensFitSummary,
  buildLensHref,
  getRoleLensDefinition,
  type RoleLens,
} from "@/lib/lens/roleLens";
import { RotatingImage } from "@/components/primitives/RotatingImage";

interface ProjectsProps {
  projects: Project[];
  lens: RoleLens;
  profile: Profile;
  locale: Locale;
}

export function Projects({ projects, lens, profile, locale }: ProjectsProps) {
  const lensDefinition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).projects;

  return (
    <section
      id="projects"
      data-mascot-anchor="section_projects"
      className="border-border bg-surface scroll-mt-24 rounded-3xl border p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
        <p className="text-muted text-sm">
          {formatMessage(dict.selectedOrderedFor, {
            count: projects.length,
            role: lensDefinition.shortLabel,
          })}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project, index) => {
          const previewImage = project.images[0] ?? "/file.svg";
          const fitSummary = buildLensFitSummary(project, lens, locale);
          const hasMultipleImages = project.images.length > 1;

          return (
            <article
              key={project.slug}
              className="border-border bg-background overflow-hidden rounded-2xl border"
            >
              <div className="border-border relative h-44 w-full border-b">
                {hasMultipleImages ? (
                  <RotatingImage
                    images={project.images}
                    alt={project.title}
                    className="relative h-44 w-full"
                    interval={4000}
                  />
                ) : (
                  <Image
                    src={previewImage}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <p className="text-accent mb-1 text-xs font-medium tracking-[0.15em] uppercase">
                  {project.status} · {project.period}
                </p>
                <h3 className="mb-2 text-lg font-semibold">{project.title}</h3>
                <p className="text-muted mb-4 text-sm leading-6">
                  {project.shortSummary}
                </p>
                {fitSummary ? (
                  <p className="text-accent mb-4 text-xs leading-5">
                    {fitSummary}
                  </p>
                ) : null}
                <ul className="mb-4 flex flex-wrap gap-2">
                  {project.tech.slice(0, 4).map((item) => (
                    <li
                      key={item}
                      className="border-border text-muted rounded-full border px-2.5 py-1 text-xs"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={
                      buildLensHref(`/projects/${project.slug}`, lens) as Route
                    }
                    aria-label={formatMessage(dict.ariaDetails, {
                      title: project.title,
                    })}
                    data-mascot-project-slug={project.slug}
                    data-mascot-project-title={project.title}
                    {...(index === 0
                      ? { "data-mascot-anchor": "project_primary_case_home" }
                      : {})}
                    className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90"
                  >
                    {dict.viewDetails}
                  </Link>
                  {project.links.github ? (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={formatMessage(dict.ariaCode, {
                        title: project.title,
                      })}
                      className="border-border text-muted hover:bg-surface inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs transition"
                    >
                      <Github className="h-3.5 w-3.5" />
                      {dict.code}
                    </a>
                  ) : null}
                  {project.links.demo ? (
                    <a
                      href={project.links.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={formatMessage(dict.ariaDemo, {
                        title: project.title,
                      })}
                      className="border-border text-muted hover:bg-surface inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {dict.liveDemo}
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-border bg-background mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <p className="text-muted text-sm">{dict.wantLevelOfWork}</p>
        <a
          href={`mailto:${profile.contact.email}`}
          className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90"
        >
          <Mail className="h-3.5 w-3.5" />
          {dict.startConversation}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
