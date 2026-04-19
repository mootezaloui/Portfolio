import type { Locale } from "./config";

type Dict = typeof en;

export const en = {
  common: {
    skipToMain: "Skip to main content",
    themeLabel: "Theme preference",
    localeLabel: "Language preference",
  },
  header: {
    taglineFallback: "Software engineer · AI systems · Security",
  },
  nav: {
    primaryLabel: "Primary navigation",
    onThisPage: "On this page",
    overview: "Overview",
    whyMe: "Why Me",
    projects: "Projects",
    experience: "Experience",
    skills: "Skills",
    contact: "Contact",
    askAssistant: "Ask my assistant",
    hireMe: "Hire me",
  },
  stickyCta: {
    ariaLabel: "Jump to contact — hire Mootez",
    label: "Hire me",
  },
  footer: {
    motto: "Built to be evaluated, not just viewed.",
    howItWorks: "How this portfolio works",
  },
  hero: {
    availableFor: "Available for {role} roles",
    proofPoints: [
      {
        label: "AI systems in production",
        detail:
          "LLM agents with scope enforcement, evaluation, and measurable reliability.",
      },
      {
        label: "Security-first engineering",
        detail:
          "Adversarial testing and threat modeling baked into design, not bolted on.",
      },
      {
        label: "Ships, doesn't demo",
        detail:
          "Projects deployed end-to-end — with tradeoffs documented and outcomes measured.",
      },
    ],
    whyMe: "Why me",
    askAssistant: "Ask my assistant",
    resume: "Resume",
    github: "GitHub",
    linkedin: "LinkedIn",
    avatarAlt: "{name} profile",
  },
  about: {
    title: "Why me",
    framedFor: "Framed for {role} hiring",
    whatIBuild: "What I build",
    whatMakesDifferent: "What makes me different",
    rolesITarget: "Roles I target",
    basedIn: "Based in {location}.",
    hiringCta: "Hiring for one of these? Let's talk.",
    emailMe: "Email me",
    askAssistant: "Ask my assistant",
  },
  projects: {
    title: "Projects",
    selectedOrderedFor: "{count} selected · ordered for {role}",
    viewDetails: "View details",
    code: "Code",
    liveDemo: "Live demo",
    wantLevelOfWork: "Want to see this level of work on your product?",
    startConversation: "Start a conversation",
    ariaDetails: "Open details for {title}",
    ariaCode: "Open source code for {title}",
    ariaDemo: "Open publication or demo for {title}",
    backToProjects: "Back to projects",
    viewingThrough: "Viewing through {role}",
    keyFeatures: "Key Features",
    outcomes: "Outcomes",
    technicalDetails: "Technical Details",
    sourceCode: "Source Code",
    demoPublication: "Demo / Publication",
  },
  experience: {
    title: "Professional Experience",
    leadershipTitle: "Leadership & Community",
    leadershipDescription:
      "Student organizations, campus roles, and volunteer work.",
    workDescription: "Internships, freelance, and product-owner work.",
    emphasizedFor: "Emphasized for {role}",
    tech: "Tech: {list}",
    fitsRole: "Think my background fits a role you're hiring for?",
    getInTouch: "Get in touch",
  },
  skills: {
    title: "Skills",
    orderedBy: "Ordered by {role} relevance",
    proficiency: "{skill} proficiency",
    yearsShort: "{years}y",
  },
  education: {
    title: "Education",
  },
  contact: {
    title: "Let's talk",
    description:
      "The fastest way to reach me is email — I reply within a business day.",
    linkedin: "LinkedIn",
    github: "GitHub",
    ariaEmail: "Email {name}",
    ariaLinkedin: "{name} on LinkedIn",
    ariaGithub: "{name} on GitHub",
    ariaPhone: "Call {name}",
  },
  certifications: {
    title: "Certifications",
    fullList: "Full LinkedIn List",
    credentialId: "Credential ID: {id}",
    notPublic: "Not public",
    verify: "Verify credential",
    issuerLogo: "{issuer} logo",
  },
  research: {
    title: "Research & Publications",
    readPaper: "Read paper",
    code: "Code",
  },
  betaPrograms: {
    title: "Beta Programs",
    description:
      "Early-access programs where I provide structured engineering feedback on AI features and system-level behavior.",
  },
  exploreBy: {
    title: "How do you want to explore?",
    description: "Three entry paths depending on what you need.",
    fastOverviewTitle: "Fast overview",
    fastOverviewSubtitle: "For recruiters — 30 seconds",
    fastOverviewDescription:
      "Top projects, target roles, and a clean summary. Skip the engineering detail.",
    fastOverviewCta: "Start here",
    deepDiveTitle: "Technical deep dive",
    deepDiveSubtitle: "For engineers — 5+ minutes",
    deepDiveDescription:
      "Project architectures, tradeoffs, and code. Evidence for how I actually build.",
    deepDiveCta: "See projects",
    assistantTitle: "Ask my assistant",
    assistantSubtitle: "Guided — on your terms",
    assistantDescription:
      "A narrow AI agent trained on my work. Ask about fit, tradeoffs, or concerns.",
    assistantCta: "Start a conversation",
    caseStudyTitle: "For engineers: how this site is built",
    caseStudyDescription:
      "Architecture, agent-aware routing, and the policy layers behind the assistant.",
    caseStudyCta: "Read the case study",
  },
  lens: {
    viewByRole: "View by role",
    adaptToHiring:
      "Adapt this profile to your hiring context — content reorders, emphasis shifts.",
    adaptAria: "Adapt this profile to your hiring context",
    viewingAs: "Viewing as",
    viewAria: "{role} view",
  },
  notFound: {
    tag: "404",
    title: "Route Not Found",
    body:
      "The path you requested is not available in this runtime. Use one of the verified entry points below.",
    home: "Home",
    twin: "Twin",
    caseStudy: "Case Study",
  },
  twin: {
    tag: "Tazou Runtime",
    title: "Digital Twin Interview",
    description:
      "This mode is intentionally narrow: ask about Mootez's systems, failures, decisions, and professional opinion context.",
    backToPortfolio: "Back to Portfolio",
  },
  caseStudy: {
    metaTitle: "Case Study",
    metaDescription:
      "How Tazou Runtime is engineered: constrained twin behavior, agent-aware routing, and failure-aware system design.",
    ogTitle: "Tazou Runtime Case Study",
    ogDescription:
      "Architecture, policy layers, and operational decisions behind the portfolio runtime.",
    headerTag: "Public Engineering Case Study",
    headerTitle: "How Tazou Runtime Works",
    headerIntro:
      "This portfolio is an inspectable runtime, not a static gallery. The goal is to show how {name} designs AI systems that stay useful under constraints, misuse attempts, and adversarial traffic.",
    currentLens: "Current case-study lens: {role}",
    publicSystems: "{count} public systems",
    experienceRecords: "{count} experience records",
    skillDomains: "{count} skill domains",
    systemOverviewTitle: "System Overview",
    systemOverviewBody:
      "The runtime has two explicit paths. Human visitors get the narrative portfolio plus a constrained digital twin. Scraping agents are routed to a machine-readable layer designed for precise summarization.",
    twinControlsTitle: "Digital Twin Controls",
    twinControlsBody:
      "The twin is intentionally narrow. It only answers about Mootez's work, systems, and professional judgments. Scope is enforced before and after the model call to reduce cost and prevent drift.",
    twinBullets: [
      "Out-of-scope prompts are deflected without provider calls.",
      "Response validator blocks generic-assistant or drifted outputs.",
      "Retrieval is corpus-grounded and prompt assembly is deterministic.",
    ],
    agentGauntletTitle: "Agent Gauntlet",
    agentGauntletBody:
      "Middleware evaluates user-agent and request context. High-confidence agents are rewritten to `/agent`, where stable JSON and text endpoints provide a more reliable summary surface.",
    failureModesTitle: "Failure Modes and Mitigations",
    failurePromptDriftTitle: "Prompt Drift",
    failurePromptDriftBody:
      "Risk: the twin starts behaving like a generic assistant. Mitigation: validator checks phrasing and behavior constraints, then substitutes deflections when needed.",
    failureAgentMisTitle: "Agent Misclassification",
    failureAgentMisBody:
      "Risk: some automated traffic looks browser-like. Mitigation: confidence bands, self-identification override (`?agent=1`), and conservative routing for medium confidence.",
    failureProviderTitle: "Provider Instability",
    failureProviderBody:
      "Risk: one model endpoint fails or rate-limits. Mitigation: provider fallback chain and safe deflection behavior under degraded conditions.",
    failureLowSignalTitle: "Low-Signal Summaries",
    failureLowSignalBody:
      "Risk: crawlers produce vague candidate summaries. Mitigation: machine-readable profile/projects/verdict routes with evidence-linked strengths and concerns.",
    inspectionTitle: "Inspection Entry Points",
    inspectionTwin: "Twin interactive mode:",
    inspectionAgent: "Agent landing:",
    inspectionHuman: "Human portfolio:",
  },
  meta: {
    siteTitle: "Tazou Runtime",
    siteDescription:
      "Software engineering portfolio runtime with role-based lenses across AI, ML, and cybersecurity.",
    ogDescription:
      "Role-lensed software engineering portfolio with a constrained digital twin and agent-facing routes.",
    twitterDescription:
      "Software engineering portfolio with role lenses, constrained twin behavior, and agent-facing endpoints.",
  },
};

export const fr: Dict = {
  common: {
    skipToMain: "Aller au contenu principal",
    themeLabel: "Préférence de thème",
    localeLabel: "Préférence de langue",
  },
  header: {
    taglineFallback: "Ingénieur logiciel · Systèmes IA · Sécurité",
  },
  nav: {
    primaryLabel: "Navigation principale",
    onThisPage: "Sur cette page",
    overview: "Vue d'ensemble",
    whyMe: "Pourquoi moi",
    projects: "Projets",
    experience: "Expérience",
    skills: "Compétences",
    contact: "Contact",
    askAssistant: "Parler à mon assistant",
    hireMe: "Me recruter",
  },
  stickyCta: {
    ariaLabel: "Aller au contact — recruter Mootez",
    label: "Me recruter",
  },
  footer: {
    motto: "Conçu pour être évalué, pas seulement regardé.",
    howItWorks: "Comment ce portfolio fonctionne",
  },
  hero: {
    availableFor: "Disponible pour des postes {role}",
    proofPoints: [
      {
        label: "Systèmes IA en production",
        detail:
          "Agents LLM avec contrôle de portée, évaluation et fiabilité mesurable.",
      },
      {
        label: "Ingénierie orientée sécurité",
        detail:
          "Tests adversariaux et modélisation des menaces intégrés dès la conception.",
      },
      {
        label: "Livrer, pas seulement démontrer",
        detail:
          "Projets déployés de bout en bout — compromis documentés, résultats mesurés.",
      },
    ],
    whyMe: "Pourquoi moi",
    askAssistant: "Parler à mon assistant",
    resume: "CV",
    github: "GitHub",
    linkedin: "LinkedIn",
    avatarAlt: "Photo de {name}",
  },
  about: {
    title: "Pourquoi moi",
    framedFor: "Adapté au recrutement {role}",
    whatIBuild: "Ce que je construis",
    whatMakesDifferent: "Ce qui me distingue",
    rolesITarget: "Postes visés",
    basedIn: "Basé à {location}.",
    hiringCta: "Vous recrutez sur l'un de ces postes ? Parlons-en.",
    emailMe: "M'écrire",
    askAssistant: "Parler à mon assistant",
  },
  projects: {
    title: "Projets",
    selectedOrderedFor: "{count} sélectionnés · triés pour {role}",
    viewDetails: "Voir les détails",
    code: "Code",
    liveDemo: "Démo en ligne",
    wantLevelOfWork:
      "Envie de voir ce niveau de travail appliqué à votre produit ?",
    startConversation: "Démarrer une conversation",
    ariaDetails: "Ouvrir les détails de {title}",
    ariaCode: "Ouvrir le code source de {title}",
    ariaDemo: "Ouvrir la publication ou la démo de {title}",
    backToProjects: "Retour aux projets",
    viewingThrough: "Vue à travers {role}",
    keyFeatures: "Fonctionnalités clés",
    outcomes: "Résultats",
    technicalDetails: "Détails techniques",
    sourceCode: "Code source",
    demoPublication: "Démo / Publication",
  },
  experience: {
    title: "Expérience professionnelle",
    leadershipTitle: "Engagement & communauté",
    leadershipDescription:
      "Associations étudiantes, rôles sur campus et bénévolat.",
    workDescription: "Stages, freelance et expériences en Product Ownership.",
    emphasizedFor: "Mis en avant pour {role}",
    tech: "Tech : {list}",
    fitsRole:
      "Vous pensez que mon profil correspond à un poste que vous recrutez ?",
    getInTouch: "Me contacter",
  },
  skills: {
    title: "Compétences",
    orderedBy: "Triées par pertinence pour {role}",
    proficiency: "Maîtrise de {skill}",
    yearsShort: "{years} a",
  },
  education: {
    title: "Formation",
  },
  contact: {
    title: "Parlons-en",
    description:
      "Le moyen le plus rapide de me joindre est l'email — je réponds sous un jour ouvré.",
    linkedin: "LinkedIn",
    github: "GitHub",
    ariaEmail: "Envoyer un email à {name}",
    ariaLinkedin: "{name} sur LinkedIn",
    ariaGithub: "{name} sur GitHub",
    ariaPhone: "Appeler {name}",
  },
  certifications: {
    title: "Certifications",
    fullList: "Liste LinkedIn complète",
    credentialId: "Identifiant : {id}",
    notPublic: "Non public",
    verify: "Vérifier la certification",
    issuerLogo: "Logo de {issuer}",
  },
  research: {
    title: "Recherche & publications",
    readPaper: "Lire l'article",
    code: "Code",
  },
  betaPrograms: {
    title: "Programmes bêta",
    description:
      "Programmes en accès anticipé dans lesquels je donne un retour d'ingénierie structuré sur les fonctionnalités IA et le comportement système.",
  },
  exploreBy: {
    title: "Comment souhaitez-vous explorer ?",
    description: "Trois chemins selon ce dont vous avez besoin.",
    fastOverviewTitle: "Vue rapide",
    fastOverviewSubtitle: "Pour recruteurs — 30 secondes",
    fastOverviewDescription:
      "Meilleurs projets, postes visés et résumé clair. Sans détail technique.",
    fastOverviewCta: "Commencer ici",
    deepDiveTitle: "Plongée technique",
    deepDiveSubtitle: "Pour ingénieurs — 5+ minutes",
    deepDiveDescription:
      "Architectures, compromis et code. Preuves concrètes de ma manière de construire.",
    deepDiveCta: "Voir les projets",
    assistantTitle: "Parler à mon assistant",
    assistantSubtitle: "Guidé — à votre rythme",
    assistantDescription:
      "Un agent IA restreint à mon travail. Posez des questions sur le fit, les compromis ou vos doutes.",
    assistantCta: "Démarrer une conversation",
    caseStudyTitle: "Pour ingénieurs : comment ce site est construit",
    caseStudyDescription:
      "Architecture, routage sensible aux agents et couches de contrôle derrière l'assistant.",
    caseStudyCta: "Lire l'étude de cas",
  },
  lens: {
    viewByRole: "Vue par rôle",
    adaptToHiring:
      "Adaptez ce profil à votre contexte de recrutement — le contenu se réorganise, l'accent change.",
    adaptAria: "Adapter ce profil à votre contexte de recrutement",
    viewingAs: "Vue en tant que",
    viewAria: "Vue {role}",
  },
  notFound: {
    tag: "404",
    title: "Route introuvable",
    body:
      "Le chemin demandé n'existe pas dans ce runtime. Utilisez l'un des points d'entrée ci-dessous.",
    home: "Accueil",
    twin: "Jumeau",
    caseStudy: "Étude de cas",
  },
  twin: {
    tag: "Tazou Runtime",
    title: "Entretien avec le jumeau numérique",
    description:
      "Ce mode est volontairement restreint : posez des questions sur les systèmes, les échecs, les décisions et les jugements professionnels de Mootez.",
    backToPortfolio: "Retour au portfolio",
  },
  caseStudy: {
    metaTitle: "Étude de cas",
    metaDescription:
      "Comment Tazou Runtime est conçu : comportement contraint du jumeau, routage sensible aux agents et conception consciente des défaillances.",
    ogTitle: "Étude de cas Tazou Runtime",
    ogDescription:
      "Architecture, couches de politique et décisions opérationnelles derrière le runtime du portfolio.",
    headerTag: "Étude de cas d'ingénierie publique",
    headerTitle: "Comment fonctionne Tazou Runtime",
    headerIntro:
      "Ce portfolio est un runtime inspectable, pas une galerie statique. L'objectif est de montrer comment {name} conçoit des systèmes IA qui restent utiles sous contraintes, tentatives d'abus et trafic adversarial.",
    currentLens: "Vue actuelle de l'étude : {role}",
    publicSystems: "{count} systèmes publics",
    experienceRecords: "{count} expériences enregistrées",
    skillDomains: "{count} domaines de compétences",
    systemOverviewTitle: "Vue d'ensemble du système",
    systemOverviewBody:
      "Le runtime a deux chemins explicites. Les visiteurs humains obtiennent le portfolio narratif et un jumeau numérique restreint. Les agents de scraping sont dirigés vers une couche lisible par machine conçue pour un résumé précis.",
    twinControlsTitle: "Contrôles du jumeau numérique",
    twinControlsBody:
      "Le jumeau est volontairement restreint. Il ne répond qu'à propos du travail, des systèmes et des jugements professionnels de Mootez. La portée est contrôlée avant et après l'appel au modèle pour réduire le coût et éviter la dérive.",
    twinBullets: [
      "Les requêtes hors portée sont déviées sans appel au fournisseur.",
      "Un validateur de réponse bloque les sorties génériques ou dérivantes.",
      "La récupération est ancrée dans le corpus et l'assemblage de prompt est déterministe.",
    ],
    agentGauntletTitle: "Gauntlet d'agents",
    agentGauntletBody:
      "Le middleware évalue l'user-agent et le contexte de la requête. Les agents avec haute confiance sont réécrits vers `/agent`, où des endpoints JSON et texte stables offrent une surface de résumé plus fiable.",
    failureModesTitle: "Modes de défaillance et mitigations",
    failurePromptDriftTitle: "Dérive de prompt",
    failurePromptDriftBody:
      "Risque : le jumeau se met à se comporter comme un assistant générique. Mitigation : le validateur vérifie la formulation et les contraintes de comportement, puis substitue une déviation si nécessaire.",
    failureAgentMisTitle: "Mauvaise classification d'agent",
    failureAgentMisBody:
      "Risque : du trafic automatisé paraît humain. Mitigation : bandes de confiance, override d'auto-identification (`?agent=1`) et routage conservateur en confiance moyenne.",
    failureProviderTitle: "Instabilité du fournisseur",
    failureProviderBody:
      "Risque : un endpoint de modèle échoue ou limite le débit. Mitigation : chaîne de repli entre fournisseurs et déviation sûre en cas de dégradation.",
    failureLowSignalTitle: "Résumés peu informatifs",
    failureLowSignalBody:
      "Risque : les crawlers produisent des résumés vagues. Mitigation : routes profile/projects/verdict lisibles par machine, avec forces et réserves liées à des preuves.",
    inspectionTitle: "Points d'entrée d'inspection",
    inspectionTwin: "Mode interactif du jumeau :",
    inspectionAgent: "Page agent :",
    inspectionHuman: "Portfolio humain :",
  },
  meta: {
    siteTitle: "Tazou Runtime",
    siteDescription:
      "Runtime de portfolio d'ingénierie logicielle avec des vues par rôle en IA, ML et cybersécurité.",
    ogDescription:
      "Portfolio d'ingénierie logicielle avec vues par rôle, jumeau numérique restreint et routes dédiées aux agents.",
    twitterDescription:
      "Portfolio d'ingénierie logicielle avec vues par rôle, comportement de jumeau contraint et endpoints pour agents.",
  },
};

const dictionaries: Record<Locale, Dict> = { en, fr };

export function getDictionary(locale: Locale): Dict {
  return dictionaries[locale] ?? en;
}

export function formatMessage(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}
