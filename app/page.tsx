import { LensContextBanner } from "@/components/lens/LensContextBanner";
import { LensSelector } from "@/components/lens/LensSelector";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OnThisPageRail, type OnPageItem } from "@/components/layout/OnThisPageRail";
import { About } from "@/components/sections/About";
import { BetaPrograms } from "@/components/sections/BetaPrograms";
import { Certifications } from "@/components/sections/Certifications";
import { Contact } from "@/components/sections/Contact";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { ExploreBy } from "@/components/sections/ExploreBy";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Research } from "@/components/sections/Research";
import { Skills } from "@/components/sections/Skills";
import {
  getCertifications,
  getEducation,
  getExperiences,
  getProfile,
  getPublications,
  getPublicProjects,
  getSkillCategories,
} from "@/lib/content/loader";
import { buildHumanJsonLdGraph } from "@/lib/agents/profile";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/getLocale";
import {
  getLensFromSearchParams,
  rankCertificationsForLens,
  rankExperiencesForLens,
  rankProjectsForLens,
  rankSkillCategoriesForLens,
  toProjectScoreMap,
} from "@/lib/lens/roleLens";
import {
  buildHomeTabHref,
  getHomeTabFromSearchParams,
  type HomeTab,
} from "@/lib/navigation/homeTabs";

const isPagesBuild = process.env.GITHUB_PAGES === "true";

interface HomePageProps {
  searchParams: Promise<{
    lens?: string | string[];
    tab?: string | string[];
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = isPagesBuild ? {} : await searchParams;
  const lens = getLensFromSearchParams(resolvedSearchParams);
  const activeTab = getHomeTabFromSearchParams(resolvedSearchParams);
  const showAllSections = isPagesBuild;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const experienceDict = dict.experience;

  const profile = getProfile(locale);
  const rankedProjects = rankProjectsForLens(
    getPublicProjects(locale),
    lens
  );
  const projects = rankedProjects.map((entry) => entry.item);
  const projectScoreMap = toProjectScoreMap(rankedProjects);

  const rankedExperiences = rankExperiencesForLens(
    getExperiences(locale),
    lens
  );
  const experiences = rankedExperiences.map((entry) => entry.item);

  const workExperiences = experiences.filter(
    (item) => item.category === "work"
  );
  const leadershipExperiences = experiences.filter(
    (item) => item.category === "leadership" || item.category === "campus"
  );
  const betaPrograms = experiences.filter((item) => item.category === "beta");

  const rankedCategories = rankSkillCategoriesForLens(
    getSkillCategories(locale),
    lens,
    projectScoreMap
  );
  const categories = rankedCategories.map((entry) => entry.item);

  const rankedCertifications = rankCertificationsForLens(
    getCertifications(locale),
    lens
  );
  const certifications =
    lens === "general"
      ? rankedCertifications.map((entry) => entry.item)
      : (() => {
          const relevant = rankedCertifications
            .filter((entry) => entry.score > 0)
            .map((entry) => entry.item);
          return relevant.length > 0
            ? relevant
            : rankedCertifications.map((entry) => entry.item);
        })();
  const education = getEducation(locale);
  const publications = getPublications(locale);
  const structuredData = buildHumanJsonLdGraph();
  const onPageItemsByTab: Record<HomeTab, OnPageItem[]> = {
    "why-me": [
      {
        id: "why-me",
        label: dict.about.title,
      },
      {
        id: "explore",
        label: dict.exploreBy.title,
      },
    ],
    projects: [
      {
        id: "projects",
        label: dict.projects.title,
      },
      ...(publications.length > 0
        ? [
            {
              id: "research",
              label: dict.research.title,
            },
          ]
        : []),
    ],
    experience: [
      ...(workExperiences.length > 0
        ? [
            {
              id: "experience",
              label: dict.experience.title,
            },
          ]
        : []),
      ...(education.length > 0
        ? [
            {
              id: "education",
              label: dict.education.title,
            },
          ]
        : []),
      ...(leadershipExperiences.length > 0
        ? [
            {
              id: "leadership",
              label: dict.experience.leadershipTitle,
            },
          ]
        : []),
      ...(betaPrograms.length > 0
        ? [
            {
              id: "beta-programs",
              label: dict.betaPrograms.title,
            },
          ]
        : []),
    ],
    skills: [
      {
        id: "skills",
        label: dict.skills.title,
      },
      {
        id: "certifications",
        label: dict.certifications.title,
      },
    ],
    contact: [
      {
        id: "contact",
        label: dict.contact.title,
      },
    ],
  };
  const baseOverviewItem: OnPageItem = {
    id: "overview",
    label: dict.nav.overview,
  };
  const allTabItems = [
    ...(onPageItemsByTab["why-me"] ?? []),
    ...(onPageItemsByTab.projects ?? []),
    ...(onPageItemsByTab.experience ?? []),
    ...(onPageItemsByTab.skills ?? []),
    ...(onPageItemsByTab.contact ?? []),
  ];
  const onPageItems = showAllSections
    ? [baseOverviewItem, ...allTabItems]
    : [baseOverviewItem, ...(onPageItemsByTab[activeTab] ?? [])];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header
        lens={lens}
        activeTab={activeTab}
        locale={locale}
        name={profile.name}
      />
      <main
        id="main-content"
        className="relative mx-auto grid w-full max-w-6xl gap-8 px-6 py-10"
      >
        <aside
          className="fixed top-32 z-20 hidden w-52 min-[1660px]:block"
          style={{ left: "calc((100vw - 72rem) / 2 - 13rem)" }}
        >
          <OnThisPageRail title={dict.nav.onThisPage} items={onPageItems} />
        </aside>
        <Hero profile={profile} lens={lens} locale={locale} />
        {!showAllSections ? (
          <>
            <LensSelector
              currentLens={lens}
              basePath={buildHomeTabHref(activeTab, "general")}
              locale={locale}
            />
            <LensContextBanner lens={lens} locale={locale} />
          </>
        ) : null}
        {showAllSections || activeTab === "why-me" ? (
          <>
            <About profile={profile} lens={lens} locale={locale} />
            <ExploreBy lens={lens} locale={locale} />
          </>
        ) : null}
        {showAllSections || activeTab === "projects" ? (
          <>
            <Projects
              projects={projects}
              lens={lens}
              profile={profile}
              locale={locale}
            />
            <Research publications={publications} locale={locale} />
          </>
        ) : null}
        {showAllSections || activeTab === "experience" ? (
          <>
            <Experience
              experiences={workExperiences}
              lens={lens}
              locale={locale}
              profile={profile}
              id="experience"
              title={experienceDict.title}
              description={experienceDict.workDescription}
              showCta
            />
            <Education education={education} locale={locale} />
            <Experience
              experiences={leadershipExperiences}
              lens={lens}
              locale={locale}
              id="leadership"
              title={experienceDict.leadershipTitle}
              description={experienceDict.leadershipDescription}
              showLensNote={false}
              showCta={false}
            />
            <BetaPrograms programs={betaPrograms} locale={locale} />
          </>
        ) : null}
        {showAllSections || activeTab === "skills" ? (
          <>
            <Skills categories={categories} lens={lens} locale={locale} />
            <Certifications certifications={certifications} locale={locale} />
          </>
        ) : null}
        {showAllSections || activeTab === "contact" ? (
          <Contact profile={profile} locale={locale} />
        ) : null}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
