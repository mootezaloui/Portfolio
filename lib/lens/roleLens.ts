import type {
  Certification,
  Experience,
  Project,
  SkillCategory,
} from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { IS_STATIC_EXPORT } from "../site/runtime";

export const ROLE_LENSES = [
  "general",
  "cloud",
  "ml",
  "ai",
  "cyber",
  "ui-ux",
] as const;

export type RoleLens = (typeof ROLE_LENSES)[number];

export interface RoleLensDefinition {
  id: RoleLens;
  label: string;
  shortLabel: string;
  description: string;
  heroLine: string;
  twinHint: string;
  projectKeywords: string[];
  skillKeywords: string[];
  experienceKeywords: string[];
  positioning: string;
  whatIBuild: string;
  whatMakesMeDifferent: string;
  targetRoles: string[];
  assistantPrompts: string[];
}

export interface RankedItem<T> {
  item: T;
  score: number;
}

type LocalizedLensText = Pick<
  RoleLensDefinition,
  | "label"
  | "shortLabel"
  | "description"
  | "heroLine"
  | "positioning"
  | "whatIBuild"
  | "whatMakesMeDifferent"
  | "targetRoles"
  | "assistantPrompts"
>;

const ROLE_LENS_DEFINITIONS: Record<RoleLens, RoleLensDefinition> = {
  general: {
    id: "general",
    label: "General Engineering",
    shortLabel: "General",
    description:
      "Balanced view across security, AI, ML, and product delivery evidence.",
    heroLine:
      "Cross-domain engineering profile with strongest signal in secure AI and resilient delivery.",
    twinHint:
      "Use a balanced portfolio framing unless the user asks for a narrower role context.",
    projectKeywords: [
      "system",
      "architecture",
      "delivery",
      "full stack",
      "security",
      "ai",
      "cloud",
      "reliability",
    ],
    skillKeywords: [
      "python",
      "node",
      "react",
      "security",
      "docker",
      "ci/cd",
      "machine learning",
    ],
    experienceKeywords: ["engineer", "intern", "delivery", "secure", "project"],
    positioning:
      "I'm a software engineer who builds AI systems that behave under adversarial conditions — and ships them with the reliability mindset of a traditional systems engineer.",
    whatIBuild:
      "LLM-powered products, evaluation pipelines, and security-critical backends — with explicit constraints, measurable outcomes, and deploy-ready delivery.",
    whatMakesMeDifferent:
      "I sit on the overlap of AI engineering and security: I design agent systems that can be audited, stress-tested, and trusted in production — not just demoed.",
    targetRoles: [
      "AI Engineer",
      "LLM Systems Engineer",
      "AI Security Engineer",
      "Software Architect",
    ],
    assistantPrompts: [
      "Summarize Mootez for a recruiter in 30 seconds",
      "What roles is he best suited for?",
      "What are his strongest projects and why?",
      "What concerns might a hiring manager have?",
    ],
  },
  cloud: {
    id: "cloud",
    label: "Cloud Engineering",
    shortLabel: "Cloud",
    description:
      "Highlights infrastructure, deployment, containerization, and operational reliability.",
    heroLine:
      "Cloud-focused lens emphasizing deployability, automation, and production-safe operations.",
    twinHint:
      "Prioritize cloud architecture, deployment pipelines, and platform reliability tradeoffs.",
    projectKeywords: [
      "cloud",
      "docker",
      "azure",
      "aws",
      "ci/cd",
      "deployment",
      "infrastructure",
      "container",
      "operational",
      "reproducible",
      "linux",
      "backend",
      "api",
    ],
    skillKeywords: [
      "docker",
      "cloud",
      "azure",
      "aws",
      "ci/cd",
      "linux",
      "bash",
      "node",
      "express",
      "rest",
    ],
    experienceKeywords: [
      "cloud",
      "deployment",
      "ci/cd",
      "secure backend",
      "operations",
      "architecture",
    ],
    positioning:
      "I'm a software engineer focused on deploying AI and security workloads into reliable, reproducible cloud environments.",
    whatIBuild:
      "Containerized backends, CI/CD pipelines, and deployment flows that make AI systems safe to ship and simple to operate.",
    whatMakesMeDifferent:
      "I treat infrastructure as part of the product: failure modes, rollbacks, and observability are decisions I make early, not after an incident.",
    targetRoles: [
      "Cloud Engineer",
      "Platform Engineer",
      "DevOps Engineer",
      "Backend Engineer",
    ],
    assistantPrompts: [
      "How does he approach deployment and reliability?",
      "What infrastructure has he actually shipped?",
      "How does he handle production failure modes?",
      "What is his cloud stack in practice?",
    ],
  },
  ml: {
    id: "ml",
    label: "Machine Learning",
    shortLabel: "ML",
    description:
      "Prioritizes model-building, data analysis, simulation, and practical ML integration.",
    heroLine:
      "ML lens focused on modeling quality, evaluation rigor, and production integration constraints.",
    twinHint:
      "Prioritize modeling choices, evaluation methodology, and practical ML integration details.",
    projectKeywords: [
      "machine learning",
      "ml",
      "model",
      "nlp",
      "classification",
      "tensorflow",
      "scikit",
      "data analysis",
      "simulation",
      "graph theory",
      "probability",
      "evaluation",
      "risk scoring",
    ],
    skillKeywords: [
      "machine learning",
      "adversarial machine learning",
      "tensorflow",
      "nlp",
      "data analysis",
      "python",
      "scikit",
      "model",
    ],
    experienceKeywords: ["ml", "model", "analysis", "simulation", "coreml"],
    positioning:
      "I'm a machine learning engineer who cares as much about evaluation and integration as modeling.",
    whatIBuild:
      "Classifiers, NLP pipelines, and applied ML components — evaluated against real distributions and wired into production systems, not notebooks.",
    whatMakesMeDifferent:
      "I come from a systems and security background, so I treat data quality, evaluation rigor, and failure analysis as first-class engineering — not afterthoughts.",
    targetRoles: [
      "ML Engineer",
      "Applied Scientist",
      "ML Platform Engineer",
      "AI/ML Research Engineer",
    ],
    assistantPrompts: [
      "How does he approach model evaluation?",
      "Which ML projects have gone into production?",
      "How does he handle data quality issues?",
      "What is his experience with NLP and classification?",
    ],
  },
  ai: {
    id: "ai",
    label: "AI Engineering",
    shortLabel: "AI",
    description:
      "Frames work around LLM systems, evaluation pipelines, and AI reliability under constraints.",
    heroLine:
      "AI engineering lens centered on evaluation pipelines, safety constraints, and robust system behavior.",
    twinHint:
      "Prioritize LLM pipeline design, AI-specific constraints, and measurable reliability outcomes.",
    projectKeywords: [
      "ai",
      "llm",
      "prompt",
      "evaluation",
      "pipeline",
      "adversarial",
      "safety",
      "risk scoring",
      "governance",
      "black-box model",
      "nlp",
      "coreml",
    ],
    skillKeywords: [
      "adversarial machine learning",
      "machine learning",
      "nlp",
      "python",
      "tensorflow",
      "llm security",
      "data analysis",
    ],
    experienceKeywords: [
      "ai",
      "llm",
      "adversarial",
      "coreml",
      "research",
      "evaluation",
    ],
    positioning:
      "I build LLM systems and agents that behave predictably — with scope enforcement, evaluation pipelines, and measurable reliability.",
    whatIBuild:
      "Agent architectures, LLM proxies with policy layers, evaluation harnesses, and AI products where correctness and safety are explicit design constraints.",
    whatMakesMeDifferent:
      "I treat LLMs as components to be constrained and tested, not magic. This portfolio itself is an example: a narrow AI agent with three layers of scope enforcement.",
    targetRoles: [
      "AI Engineer",
      "LLM Systems Engineer",
      "Agent Infrastructure Engineer",
      "AI Product Engineer",
    ],
    assistantPrompts: [
      "How does he design LLM agents that stay in scope?",
      "What evaluation methods does he use for AI systems?",
      "How is this portfolio itself an AI systems demo?",
      "What makes his AI work production-ready?",
    ],
  },
  cyber: {
    id: "cyber",
    label: "Cybersecurity",
    shortLabel: "Cyber",
    description:
      "Surfaces vulnerability discovery, threat modeling, secure coding, and adversarial testing.",
    heroLine:
      "Cybersecurity lens focused on adversarial testing depth and secure system decision quality.",
    twinHint:
      "Prioritize threat modeling, attack surfaces, mitigation decisions, and security outcomes.",
    projectKeywords: [
      "security",
      "cyber",
      "vulnerability",
      "adversarial",
      "threat",
      "penetration",
      "owasp",
      "secure coding",
      "prompt injection",
      "jailbreak",
      "risk scoring",
      "governance",
      "hardening",
      "appsec",
    ],
    skillKeywords: [
      "vulnerability assessment",
      "penetration testing",
      "secure coding",
      "owasp",
      "threat modeling",
      "api security",
      "llm security",
      "adversarial machine learning",
    ],
    experienceKeywords: [
      "cybersecurity",
      "penetration",
      "adversarial",
      "security",
      "threat",
      "hardening",
      "privacy",
    ],
    positioning:
      "I'm a security-minded engineer who red-teams AI systems and writes code that assumes hostile inputs.",
    whatIBuild:
      "Adversarial test suites, prompt-injection defenses, vulnerability assessments, and secure backends — grounded in threat modeling, not checklist compliance.",
    whatMakesMeDifferent:
      "I work where AI meets security: I break LLM systems in testing so they don't break in production, and I think about the attacker's budget before the defender's.",
    targetRoles: [
      "AI Security Engineer",
      "Application Security Engineer",
      "Security Engineer",
      "Red Team / Offensive Security",
    ],
    assistantPrompts: [
      "What adversarial testing has he done on AI systems?",
      "How does he approach threat modeling?",
      "What prompt-injection defenses has he built?",
      "Which projects show real security work?",
    ],
  },
  "ui-ux": {
    id: "ui-ux",
    label: "UI/UX Engineering",
    shortLabel: "UI/UX",
    description:
      "Highlights interface quality, interaction design, and product-facing implementation details.",
    heroLine:
      "UI/UX lens prioritizing usability, interaction workflows, and front-end execution quality.",
    twinHint:
      "Prioritize user interaction flows, interface tradeoffs, and front-end implementation details.",
    projectKeywords: [
      "ui",
      "ux",
      "frontend",
      "react",
      "vue",
      "react native",
      "chat interface",
      "dashboard",
      "workflow",
      "user-friendly",
      "realtime",
      "collaboration",
      "design",
      "interaction",
    ],
    skillKeywords: [
      "react",
      "vue",
      "html/css",
      "tailwind",
      "next.js",
      "communication",
      "project management",
    ],
    experienceKeywords: [
      "workflow",
      "user",
      "product",
      "coordination",
      "collaboration",
      "event",
    ],
    positioning:
      "I'm a product-minded engineer who ships interfaces for AI products where usability is as load-bearing as the model.",
    whatIBuild:
      "React-based front ends, AI chat and agent interfaces, and design systems that make complex, stateful products feel simple.",
    whatMakesMeDifferent:
      "I design interaction for systems that surprise users — AI outputs, adversarial edge cases — so the interface stays trustworthy even when the model isn't.",
    targetRoles: [
      "Frontend Engineer",
      "Product Engineer",
      "AI UX Engineer",
      "Full-stack Engineer",
    ],
    assistantPrompts: [
      "What front-end products has he built?",
      "How does he design for AI/LLM interfaces?",
      "What is his React and design-system experience?",
      "How does he handle uncertainty in the UI?",
    ],
  },
};

const ROLE_LENS_DEFINITIONS_FR: Record<RoleLens, LocalizedLensText> = {
  general: {
    label: "Ingénierie générale",
    shortLabel: "Général",
    description:
      "Vue équilibrée couvrant sécurité, IA, ML et livraison produit.",
    heroLine:
      "Profil d'ingénierie pluridisciplinaire, avec un signal fort sur l'IA sécurisée et la livraison fiable.",
    positioning:
      "Je suis un ingénieur logiciel qui construit des systèmes IA qui tiennent en conditions adversariales — et les livre avec l'exigence de fiabilité d'un ingénieur systèmes.",
    whatIBuild:
      "Produits basés sur LLM, pipelines d'évaluation et backends sensibles à la sécurité — avec des contraintes explicites, des résultats mesurables et une livraison prête au déploiement.",
    whatMakesMeDifferent:
      "Je me situe à l'intersection entre ingénierie IA et sécurité : je conçois des systèmes d'agents auditables, testables sous pression et exploitables en production — pas seulement démontrables.",
    targetRoles: [
      "Ingénieur IA",
      "Ingénieur systèmes LLM",
      "Ingénieur sécurité IA",
      "Architecte logiciel",
    ],
    assistantPrompts: [
      "Résume Mootez pour un recruteur en 30 secondes",
      "Pour quels postes est-il le mieux adapté ?",
      "Quels sont ses projets les plus forts et pourquoi ?",
      "Quelles réserves un responsable du recrutement pourrait-il avoir ?",
    ],
  },
  cloud: {
    label: "Ingénierie cloud",
    shortLabel: "Cloud",
    description:
      "Met en avant l'infrastructure, le déploiement, la conteneurisation et la fiabilité opérationnelle.",
    heroLine:
      "Vue cloud centrée sur la déployabilité, l'automatisation et des opérations sûres en production.",
    positioning:
      "Je suis un ingénieur logiciel spécialisé dans le déploiement de charges IA et sécurité dans des environnements cloud fiables et reproductibles.",
    whatIBuild:
      "Backends conteneurisés, pipelines CI/CD et flux de déploiement qui rendent les systèmes IA sûrs à livrer et simples à exploiter.",
    whatMakesMeDifferent:
      "Je traite l'infrastructure comme partie du produit : modes de défaillance, rollbacks et observabilité sont des décisions prises tôt, pas après un incident.",
    targetRoles: [
      "Ingénieur cloud",
      "Ingénieur plateforme",
      "Ingénieur DevOps",
      "Ingénieur backend",
    ],
    assistantPrompts: [
      "Comment aborde-t-il le déploiement et la fiabilité ?",
      "Quelle infrastructure a-t-il réellement livrée ?",
      "Comment gère-t-il les modes de défaillance en production ?",
      "Quelle est sa stack cloud en pratique ?",
    ],
  },
  ml: {
    label: "Machine Learning",
    shortLabel: "ML",
    description:
      "Met en avant la construction de modèles, l'analyse de données, la simulation et l'intégration ML concrète.",
    heroLine:
      "Vue ML centrée sur la qualité des modèles, la rigueur d'évaluation et les contraintes d'intégration en production.",
    positioning:
      "Je suis un ingénieur machine learning qui accorde autant d'importance à l'évaluation et à l'intégration qu'à la modélisation.",
    whatIBuild:
      "Classificateurs, pipelines NLP et composants ML appliqués — évalués face à de vraies distributions et branchés sur des systèmes de production, pas des notebooks.",
    whatMakesMeDifferent:
      "Venant des systèmes et de la sécurité, je traite la qualité des données, la rigueur d'évaluation et l'analyse d'échecs comme de l'ingénierie de premier plan — pas comme des détails.",
    targetRoles: [
      "Ingénieur ML",
      "Applied Scientist",
      "Ingénieur plateforme ML",
      "Ingénieur recherche IA/ML",
    ],
    assistantPrompts: [
      "Comment aborde-t-il l'évaluation de modèles ?",
      "Quels projets ML ont été mis en production ?",
      "Comment gère-t-il les problèmes de qualité de données ?",
      "Quelle est son expérience en NLP et classification ?",
    ],
  },
  ai: {
    label: "Ingénierie IA",
    shortLabel: "IA",
    description:
      "Cadre le travail autour des systèmes LLM, des pipelines d'évaluation et de la fiabilité IA sous contraintes.",
    heroLine:
      "Vue ingénierie IA centrée sur les pipelines d'évaluation, les contraintes de sécurité et le comportement système robuste.",
    positioning:
      "Je construis des systèmes LLM et des agents qui se comportent de manière prévisible — avec contrôle de portée, pipelines d'évaluation et fiabilité mesurable.",
    whatIBuild:
      "Architectures d'agents, proxies LLM avec couches de politique, harnais d'évaluation et produits IA où correction et sécurité sont des contraintes explicites.",
    whatMakesMeDifferent:
      "Je traite les LLM comme des composants à contraindre et tester, pas comme de la magie. Ce portfolio lui-même en est un exemple : un agent IA restreint avec trois couches de contrôle de portée.",
    targetRoles: [
      "Ingénieur IA",
      "Ingénieur systèmes LLM",
      "Ingénieur infrastructure d'agents",
      "Ingénieur produit IA",
    ],
    assistantPrompts: [
      "Comment conçoit-il des agents LLM qui restent dans leur portée ?",
      "Quelles méthodes d'évaluation utilise-t-il pour les systèmes IA ?",
      "En quoi ce portfolio est-il lui-même une démo de systèmes IA ?",
      "Qu'est-ce qui rend son travail IA prêt pour la production ?",
    ],
  },
  cyber: {
    label: "Cybersécurité",
    shortLabel: "Cyber",
    description:
      "Met en avant la découverte de vulnérabilités, la modélisation des menaces, le code sécurisé et les tests adversariaux.",
    heroLine:
      "Vue cybersécurité centrée sur la profondeur des tests adversariaux et la qualité des décisions de conception sécurisée.",
    positioning:
      "Je suis un ingénieur orienté sécurité qui red-teame des systèmes IA et écrit du code en supposant des entrées hostiles.",
    whatIBuild:
      "Suites de tests adversariaux, défenses contre injection de prompt, évaluations de vulnérabilités et backends sécurisés — ancrés dans la modélisation des menaces, pas dans la conformité checklist.",
    whatMakesMeDifferent:
      "Je travaille à la frontière IA/sécurité : je casse les systèmes LLM en test pour qu'ils ne cassent pas en production, et je pense au budget de l'attaquant avant celui du défenseur.",
    targetRoles: [
      "Ingénieur sécurité IA",
      "Ingénieur sécurité applicative",
      "Ingénieur sécurité",
      "Red Team / Sécurité offensive",
    ],
    assistantPrompts: [
      "Quels tests adversariaux a-t-il menés sur des systèmes IA ?",
      "Comment aborde-t-il la modélisation des menaces ?",
      "Quelles défenses contre l'injection de prompt a-t-il construites ?",
      "Quels projets montrent un vrai travail de sécurité ?",
    ],
  },
  "ui-ux": {
    label: "Ingénierie UI/UX",
    shortLabel: "UI/UX",
    description:
      "Met en avant la qualité d'interface, le design d'interaction et l'implémentation produit.",
    heroLine:
      "Vue UI/UX priorisant l'utilisabilité, les workflows d'interaction et la qualité d'exécution front-end.",
    positioning:
      "Je suis un ingénieur orienté produit qui livre des interfaces pour des produits IA où l'ergonomie pèse autant que le modèle.",
    whatIBuild:
      "Front-ends React, interfaces de chat et d'agents IA et design systems qui rendent simples des produits complexes et à état.",
    whatMakesMeDifferent:
      "Je conçois des interactions pour des systèmes qui surprennent — sorties IA, cas adversariaux — pour que l'interface reste fiable même quand le modèle ne l'est pas.",
    targetRoles: [
      "Ingénieur frontend",
      "Ingénieur produit",
      "Ingénieur UX IA",
      "Ingénieur full-stack",
    ],
    assistantPrompts: [
      "Quels produits front-end a-t-il construits ?",
      "Comment conçoit-il pour des interfaces IA/LLM ?",
      "Quelle est son expérience React et design system ?",
      "Comment gère-t-il l'incertitude dans l'UI ?",
    ],
  },
};

const ROLE_LENS_ALIASES: Record<string, RoleLens> = {
  ai: "ai",
  ml: "ml",
  cloud: "general",
  cyber: "cyber",
  security: "cyber",
  "ui-ux": "general",
  uiux: "general",
  ui: "general",
  ux: "general",
  general: "general",
  all: "general",
};

function normalize(text: string): string {
  return text.toLowerCase();
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const normalized = normalize(text);
  return keywords.reduce((count, keyword) => {
    if (normalized.includes(keyword.toLowerCase())) {
      return count + 1;
    }
    return count;
  }, 0);
}

function rankByScore<T>(items: T[], score: (item: T) => number): RankedItem<T>[] {
  return items
    .map((item, index) => ({ item, score: score(item), index }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    })
    .map(({ item, score: itemScore }) => ({ item, score: itemScore }));
}

const MONTH_TO_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function certificationDateWeight(date: string): number {
  const normalized = date.trim().toLowerCase();
  if (!normalized) {
    return 0;
  }

  if (normalized.includes("in progress")) {
    return new Date().getTime();
  }

  const monthYearMatch = normalized.match(
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})$/
  );
  if (monthYearMatch) {
    const monthKey = monthYearMatch[1];
    const yearRaw = monthYearMatch[2];
    if (!monthKey || !yearRaw) {
      return 0;
    }

    const month = MONTH_TO_INDEX[monthKey];
    const year = Number.parseInt(yearRaw, 10);
    if (Number.isNaN(year) || month === undefined) {
      return 0;
    }

    return new Date(year, month, 1).getTime();
  }

  const yearMatch = normalized.match(/^(\d{4})$/);
  if (yearMatch) {
    const yearRaw = yearMatch[1];
    if (!yearRaw) {
      return 0;
    }

    const year = Number.parseInt(yearRaw, 10);
    if (Number.isNaN(year)) {
      return 0;
    }

    return new Date(year, 0, 1).getTime();
  }

  return 0;
}

export function parseRoleLens(value: string | null | undefined): RoleLens {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return "general";
  }

  return ROLE_LENS_ALIASES[normalized] ?? "general";
}

export function getRoleLensDefinition(
  lens: RoleLens,
  locale: Locale = "en"
): RoleLensDefinition {
  const base = ROLE_LENS_DEFINITIONS[lens];
  if (locale === "en") return base;
  const overrides = ROLE_LENS_DEFINITIONS_FR[lens];
  return { ...base, ...overrides };
}

export function getRoleLensDefinitions(
  locale: Locale = "en"
): RoleLensDefinition[] {
  const visibleRoleLenses: RoleLens[] = ["general", "ml", "ai", "cyber"];
  return visibleRoleLenses.map((lens) => getRoleLensDefinition(lens, locale));
}

export function getLensFromSearchParams(searchParams: {
  lens?: string | string[];
}): RoleLens {
  const rawLens = Array.isArray(searchParams.lens)
    ? searchParams.lens[0]
    : searchParams.lens;
  return parseRoleLens(rawLens);
}

export function buildLensHref(path: string, lens: RoleLens): string {
  if (lens === "general" || IS_STATIC_EXPORT) {
    return path;
  }

  const [basePart, hash] = path.split("#");
  const base = basePart ?? "";
  const separator = base.includes("?") ? "&" : "?";
  const withLens = `${base}${separator}lens=${encodeURIComponent(lens)}`;
  return hash ? `${withLens}#${hash}` : withLens;
}

export function rankProjectsForLens(
  projects: Project[],
  lens: RoleLens
): RankedItem<Project>[] {
  const definition = getRoleLensDefinition(lens);

  if (lens === "general") {
    return projects.map((project) => ({ item: project, score: 0 }));
  }

  return rankByScore(projects, (project) => {
    const primaryText = [
      project.title,
      project.role,
      project.tags.join(" "),
      project.tech.join(" "),
    ].join(" ");
    const secondaryText = [
      project.shortSummary,
      project.longSummary,
      project.technicalDetails,
      project.features.join(" "),
      project.outcomes.join(" "),
    ].join(" ");

    const primaryMatches = countKeywordMatches(
      primaryText,
      definition.projectKeywords
    );
    const secondaryMatches = countKeywordMatches(
      secondaryText,
      definition.projectKeywords
    );

    return primaryMatches * 6 + secondaryMatches * 2;
  });
}

export function rankSkillCategoriesForLens(
  categories: SkillCategory[],
  lens: RoleLens,
  projectScores?: Map<string, number>
): RankedItem<SkillCategory>[] {
  const definition = getRoleLensDefinition(lens);

  if (lens === "general") {
    return categories.map((category) => ({ item: category, score: 0 }));
  }

  return rankByScore(categories, (category) => {
    const categoryText = `${category.title} ${category.id}`;
    const categoryMatches = countKeywordMatches(
      categoryText,
      definition.skillKeywords
    );

    const skillMatches = category.skills.reduce((sum, skill) => {
      const ownMatch = countKeywordMatches(skill.name, definition.skillKeywords);
      const evidenceBoost =
        skill.evidence?.reduce((evidenceSum, slug) => {
          const score = projectScores?.get(slug) ?? 0;
          return evidenceSum + (score > 0 ? 1 : 0);
        }, 0) ?? 0;

      return sum + ownMatch * 2 + evidenceBoost;
    }, 0);

    return categoryMatches * 5 + skillMatches;
  });
}

export function rankExperiencesForLens(
  experiences: Experience[],
  lens: RoleLens
): RankedItem<Experience>[] {
  const definition = getRoleLensDefinition(lens);

  if (lens === "general") {
    return experiences.map((experience) => ({ item: experience, score: 0 }));
  }

  return rankByScore(experiences, (experience) => {
    const primary = [experience.title, experience.company, experience.type].join(" ");
    const secondary = [
      experience.summary,
      experience.technologies.join(" "),
      experience.achievements.join(" "),
    ].join(" ");

    const primaryMatches = countKeywordMatches(
      primary,
      definition.experienceKeywords
    );
    const secondaryMatches = countKeywordMatches(
      secondary,
      definition.experienceKeywords
    );

    return primaryMatches * 5 + secondaryMatches * 2;
  });
}

export function rankCertificationsForLens(
  certifications: Certification[],
  lens: RoleLens
): RankedItem<Certification>[] {
  const definition = getRoleLensDefinition(lens);

  if (lens === "general") {
    return rankByScore(
      certifications,
      (certification) => certificationDateWeight(certification.date)
    );
  }

  const relevanceKeywords = [
    ...definition.skillKeywords,
    ...definition.projectKeywords,
    ...definition.experienceKeywords,
  ];

  return rankByScore(certifications, (certification) => {
    const primaryText = `${certification.title} ${certification.issuer}`;
    const secondaryText = certification.skills.join(" ");

    const primaryMatches = countKeywordMatches(primaryText, relevanceKeywords);
    const secondaryMatches = countKeywordMatches(secondaryText, relevanceKeywords);
    const recencyBoost = certificationDateWeight(certification.date) / 1_000_000_000_000;

    return primaryMatches * 8 + secondaryMatches * 4 + recencyBoost;
  });
}

export function toProjectScoreMap(
  rankedProjects: RankedItem<Project>[]
): Map<string, number> {
  return new Map(rankedProjects.map((entry) => [entry.item.slug, entry.score]));
}

export function buildLensFitSummary(
  project: Project,
  lens: RoleLens,
  locale: Locale = "en"
): string | null {
  if (lens === "general") {
    return null;
  }

  const definition = getRoleLensDefinition(lens, locale);
  const evidencePool = [
    ...project.tech,
    ...project.tags,
    ...project.features,
    ...project.outcomes,
  ].join(" ");
  const normalized = normalize(evidencePool);

  const topSignals = definition.projectKeywords
    .filter((keyword) => normalized.includes(keyword.toLowerCase()))
    .slice(0, 3);

  if (locale === "fr") {
    if (topSignals.length === 0) {
      return `Vue ${definition.shortLabel} : signal d'ingénierie transférable à partir de l'exécution système et des contraintes de livraison.`;
    }
    return `Vue ${definition.shortLabel} : les signaux les plus forts incluent ${topSignals.join(", ")}.`;
  }

  if (topSignals.length === 0) {
    return `${definition.shortLabel} lens: transferable engineering signal from system execution and delivery constraints.`;
  }

  return `${definition.shortLabel} lens: strongest signals include ${topSignals.join(
    ", "
  )}.`;
}

export function buildLensShareLabel(
  lens: RoleLens,
  locale: Locale = "en"
): string {
  const definition = getRoleLensDefinition(lens, locale);
  return locale === "fr"
    ? `Vue ${definition.shortLabel}`
    : `${definition.shortLabel} view`;
}
