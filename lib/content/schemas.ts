import { z } from "zod";

import {
  localizedStringArraySchema,
  localizedStringSchema,
} from "@/lib/i18n/localized";

export const profileSchema = z.object({
  name: z.string().min(1),
  tagline: localizedStringSchema,
  shortBio: localizedStringSchema,
  contact: z.object({
    email: z.string().email(),
    linkedin: z.string().url(),
    github: z.string().url(),
    website: z.string().url().optional(),
    phone: z.string().optional(),
  }),
  identity: z.object({
    positioning: localizedStringSchema,
    keywords: z.array(z.string().min(1)).min(1),
    availability: localizedStringSchema.optional(),
    location: z.string().optional(),
  }),
});

const projectLinkSchema = z.object({
  github: z.string().url().optional(),
  demo: z.string().url().optional(),
  writeup: z.string().url().optional(),
});

export const projectSchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  shortSummary: localizedStringSchema,
  longSummary: localizedStringSchema,
  role: localizedStringSchema,
  period: z.string().min(1),
  status: localizedStringSchema,
  tech: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).min(1),
  features: localizedStringArraySchema,
  technicalDetails: localizedStringSchema,
  outcomes: localizedStringArraySchema,
  links: projectLinkSchema,
  visibility: z.enum(["public", "internal-only"]),
  images: z.array(z.string().min(1)).min(1),
});

export const projectsSchema = z.object({
  projects: z.array(projectSchema),
});

export const experienceCategorySchema = z.enum([
  "work",
  "campus",
  "leadership",
  "beta",
]);

export const experienceSchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  company: z.string().min(1),
  period: z.string().min(1),
  location: z.string().min(1),
  type: localizedStringSchema,
  category: experienceCategorySchema.default("work"),
  summary: localizedStringSchema,
  achievements: localizedStringArraySchema,
  technologies: z.array(z.string().min(1)).min(1),
  confidential: z.boolean(),
});

export const experiencesSchema = z.object({
  experiences: z.array(experienceSchema),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  level: z.number().min(0).max(100),
  years: z.number().min(0),
  evidence: z.array(z.string().min(1)).optional(),
});

export const skillCategorySchema = z.object({
  id: z.string().min(1),
  title: localizedStringSchema,
  icon: z.string().min(1),
  skills: z.array(skillSchema).min(1),
});

export const skillsSchema = z.object({
  categories: z.array(skillCategorySchema).min(1),
});

export const educationSchema = z.object({
  slug: z.string().min(1),
  institution: z.string().min(1),
  degree: localizedStringSchema,
  specialization: localizedStringSchema.optional(),
  period: z.string().min(1),
  location: z.string().min(1),
  highlights: localizedStringArraySchema,
});

export const educationListSchema = z.object({
  education: z.array(educationSchema).min(1),
});

export const publicationSchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  venue: z.string().min(1),
  year: z.string().min(1),
  summary: localizedStringSchema,
  highlights: localizedStringArraySchema,
  links: z.object({
    paper: z.string().url().optional(),
    code: z.string().url().optional(),
  }),
});

export const publicationsSchema = z.object({
  publications: z.array(publicationSchema).min(1),
});

export const certificationSchema = z.object({
  title: localizedStringSchema,
  issuer: z.string().min(1),
  date: z.string(),
  credentialId: z.string(),
  image: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
  verifyUrl: z.string().url().optional(),
});

export const certificationsSchema = z.object({
  certifications: z.array(certificationSchema).min(1),
});

type RawProfile = z.infer<typeof profileSchema>;
type RawProject = z.infer<typeof projectSchema>;
type RawExperience = z.infer<typeof experienceSchema>;
type RawSkillCategory = z.infer<typeof skillCategorySchema>;
type RawEducation = z.infer<typeof educationSchema>;
type RawPublication = z.infer<typeof publicationSchema>;
type RawCertification = z.infer<typeof certificationSchema>;

type Localized<TRaw, TOverrides> = Omit<TRaw, keyof TOverrides> & TOverrides;

export type Profile = Localized<
  RawProfile,
  {
    tagline: string;
    shortBio: string;
    identity: Omit<RawProfile["identity"], "positioning" | "availability"> & {
      positioning: string;
      availability?: string;
    };
  }
>;

export type Project = Localized<
  RawProject,
  {
    title: string;
    shortSummary: string;
    longSummary: string;
    role: string;
    status: string;
    features: string[];
    technicalDetails: string;
    outcomes: string[];
  }
>;

export type ProjectsDocument = { projects: Project[] };

export type Experience = Localized<
  RawExperience,
  {
    title: string;
    type: string;
    summary: string;
    achievements: string[];
  }
>;

export type ExperienceCategory = z.infer<typeof experienceCategorySchema>;
export type ExperiencesDocument = { experiences: Experience[] };

export type Education = Localized<
  RawEducation,
  {
    degree: string;
    specialization?: string;
    highlights: string[];
  }
>;

export type EducationDocument = { education: Education[] };

export type Publication = Localized<
  RawPublication,
  {
    title: string;
    summary: string;
    highlights: string[];
  }
>;

export type PublicationsDocument = { publications: Publication[] };

export type Skill = z.infer<typeof skillSchema>;

export type SkillCategory = Localized<
  RawSkillCategory,
  {
    title: string;
  }
>;

export type SkillsDocument = { categories: SkillCategory[] };

export type Certification = Localized<
  RawCertification,
  {
    title: string;
  }
>;

export type CertificationsDocument = { certifications: Certification[] };

export type RawProfileDocument = RawProfile;
export type RawProjectDocument = RawProject;
export type RawExperienceDocument = RawExperience;
export type RawSkillCategoryDocument = RawSkillCategory;
export type RawEducationDocument = RawEducation;
export type RawPublicationDocument = RawPublication;
export type RawCertificationDocument = RawCertification;
