import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { z } from "zod";

import type { Locale } from "@/lib/i18n/config";
import {
  pickLocalized,
  pickLocalizedArray,
  pickLocalizedOptional,
} from "@/lib/i18n/localized";
import { withBasePath } from "../site/runtime";

import {
  certificationsSchema,
  educationListSchema,
  experiencesSchema,
  profileSchema,
  projectsSchema,
  publicationsSchema,
  skillsSchema,
  type Certification,
  type Education,
  type Experience,
  type Profile,
  type Project,
  type Publication,
  type RawCertificationDocument,
  type RawEducationDocument,
  type RawExperienceDocument,
  type RawProfileDocument,
  type RawProjectDocument,
  type RawPublicationDocument,
  type RawSkillCategoryDocument,
  type SkillCategory,
} from "./schemas";

export function loadJsonContent<T>(filename: string): T {
  const absolutePath = join(process.cwd(), "content", filename);
  const raw = readFileSync(absolutePath, "utf-8");
  return JSON.parse(raw) as T;
}

function parseWithSchema<TSchema extends z.ZodTypeAny>(
  filename: string,
  schema: TSchema
): z.infer<TSchema> {
  const parsed = loadJsonContent<unknown>(filename);
  const result = schema.safeParse(parsed);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid content/${filename}: ${details}`);
  }

  return result.data;
}

const loadRawProfile = cache(
  (): RawProfileDocument => parseWithSchema("profile.json", profileSchema)
);

const loadRawProjects = cache(
  (): RawProjectDocument[] =>
    parseWithSchema("projects.json", projectsSchema).projects
);

const loadRawExperiences = cache(
  (): RawExperienceDocument[] =>
    parseWithSchema("experiences.json", experiencesSchema).experiences
);

const loadRawSkillCategories = cache(
  (): RawSkillCategoryDocument[] =>
    parseWithSchema("skills.json", skillsSchema).categories
);

const loadRawCertifications = cache(
  (): RawCertificationDocument[] =>
    parseWithSchema("certifications.json", certificationsSchema).certifications
);

const loadRawEducation = cache(
  (): RawEducationDocument[] =>
    parseWithSchema("education.json", educationListSchema).education
);

const loadRawPublications = cache(
  (): RawPublicationDocument[] =>
    parseWithSchema("publications.json", publicationsSchema).publications
);

function resolveProfile(raw: RawProfileDocument, locale: Locale): Profile {
  const { positioning, availability, ...restIdentity } = raw.identity;
  const resolvedAvailability = pickLocalizedOptional(availability, locale);
  return {
    ...raw,
    tagline: pickLocalized(raw.tagline, locale),
    shortBio: pickLocalized(raw.shortBio, locale),
    identity: {
      ...restIdentity,
      positioning: pickLocalized(positioning, locale),
      ...(resolvedAvailability !== undefined
        ? { availability: resolvedAvailability }
        : {}),
    },
  };
}

function resolveProject(raw: RawProjectDocument, locale: Locale): Project {
  return {
    ...raw,
    title: pickLocalized(raw.title, locale),
    shortSummary: pickLocalized(raw.shortSummary, locale),
    longSummary: pickLocalized(raw.longSummary, locale),
    role: pickLocalized(raw.role, locale),
    status: pickLocalized(raw.status, locale),
    features: pickLocalizedArray(raw.features, locale),
    technicalDetails: pickLocalized(raw.technicalDetails, locale),
    outcomes: pickLocalizedArray(raw.outcomes, locale),
    images: raw.images.map((image) => withBasePath(image)),
  };
}

function resolveExperience(
  raw: RawExperienceDocument,
  locale: Locale
): Experience {
  return {
    ...raw,
    title: pickLocalized(raw.title, locale),
    type: pickLocalized(raw.type, locale),
    summary: pickLocalized(raw.summary, locale),
    achievements: pickLocalizedArray(raw.achievements, locale),
  };
}

function resolveSkillCategory(
  raw: RawSkillCategoryDocument,
  locale: Locale
): SkillCategory {
  return {
    ...raw,
    title: pickLocalized(raw.title, locale),
  };
}

function resolveEducation(
  raw: RawEducationDocument,
  locale: Locale
): Education {
  const { specialization, ...rest } = raw;
  const resolvedSpecialization = pickLocalizedOptional(specialization, locale);
  return {
    ...rest,
    degree: pickLocalized(raw.degree, locale),
    ...(resolvedSpecialization !== undefined
      ? { specialization: resolvedSpecialization }
      : {}),
    highlights: pickLocalizedArray(raw.highlights, locale),
  };
}

function resolvePublication(
  raw: RawPublicationDocument,
  locale: Locale
): Publication {
  return {
    ...raw,
    title: pickLocalized(raw.title, locale),
    summary: pickLocalized(raw.summary, locale),
    highlights: pickLocalizedArray(raw.highlights, locale),
  };
}

function resolveCertification(
  raw: RawCertificationDocument,
  locale: Locale
): Certification {
  return {
    ...raw,
    title: pickLocalized(raw.title, locale),
    image: withBasePath(raw.image),
  };
}

export const getProfile = cache((locale: Locale): Profile =>
  resolveProfile(loadRawProfile(), locale)
);

export const getProjects = cache((locale: Locale): Project[] =>
  loadRawProjects().map((project) => resolveProject(project, locale))
);

export const getPublicProjects = cache((locale: Locale): Project[] =>
  getProjects(locale).filter((project) => project.visibility === "public")
);

export const getProjectBySlug = cache(
  (slug: string, locale: Locale): Project | null => {
    const raw = loadRawProjects().find((project) => project.slug === slug);
    return raw ? resolveProject(raw, locale) : null;
  }
);

export const getExperiences = cache((locale: Locale): Experience[] =>
  loadRawExperiences().map((experience) =>
    resolveExperience(experience, locale)
  )
);

export const getSkillCategories = cache((locale: Locale): SkillCategory[] =>
  loadRawSkillCategories().map((category) =>
    resolveSkillCategory(category, locale)
  )
);

export const getCertifications = cache((locale: Locale): Certification[] =>
  loadRawCertifications().map((certification) =>
    resolveCertification(certification, locale)
  )
);

export const getEducation = cache((locale: Locale): Education[] =>
  loadRawEducation().map((education) => resolveEducation(education, locale))
);

export const getPublications = cache((locale: Locale): Publication[] =>
  loadRawPublications().map((publication) =>
    resolvePublication(publication, locale)
  )
);

export { loadRawProjects };
