# Portfolio Audit for Chatbot Handoff

## Audit Scope
- Repository: `Portfolio`
- Path audited: `c:\Users\moote\OneDrive\Dokumente\GitHub\Portfolio`
- Audit date: `2026-04-17`
- Goal: explain UI, logic, and folder structure so another chatbot can reason about the project correctly.

## Reality Check (Important)
- The current codebase is a **Create React App + JavaScript** portfolio.
- It is **not** currently a React + TypeScript + Vite mode-driven runtime.
- Core implemented app entry is `src/index.js -> src/Portfolio.js`.
- If you see docs mentioning Zustand, `src/app`, `src/core`, or Vite config, treat them as planned/other-branch context, not current runtime truth.

## Tech Stack Actually Used
- Runtime: React 18
- Build/dev tooling: `react-scripts` (CRA)
- Styling: Tailwind CSS + utility classes in JSX
- Icons: `lucide-react`
- Data source style: local JSON files in `src/data/`
- Deployment intent: GitHub Pages (`homepage` + `gh-pages` script in `package.json`)

## Runtime Architecture
1. `public/index.html` provides `<div id="root"></div>`.
2. `src/index.js` renders `<Portfolio />` under `React.StrictMode`.
3. `src/Portfolio.js` defines:
- shared local UI components (`StatCard`, `TabButton`, `TypewriterText`, `AnimatedSection`)
- top-level sections (`Header`, `AboutSection`, `ProjectsSection`, `ExperienceSection`, `SkillsSection`, `CertificationsSection`, `ContributionsSection`)
4. Section components in `src/components/*` are imported and rendered in sequence.
5. Content-heavy sections read from local JSON files (`projects.json`, `experiences.json`, `skills.json`, `certifications.json`).

## UI Structure (What User Sees)
1. Hero/Header:
- full-screen gradient header
- typewriter intro text
- profile image with glow
- contact/social CTAs
- scrolling indicator

2. About:
- stat cards (coffee/projects/years/languages)
- tab switcher with two tabs: `Background` and `Contact`
- contact tab includes resume-download CTA

3. Featured Projects:
- grid of project cards
- hover overlay with Code/Demo links
- per-card "Read more" expansion for features + technical details

4. Work Experience:
- timeline-like layout
- alternating left/right cards on desktop
- achievements list per role

5. Technical Expertise:
- category filter buttons (`all` + per-category)
- per-skill progress bars with level-based color

6. Certifications:
- certificate cards with generated gradient headers
- "See More Certifications" pagination by +6
- LinkedIn button for full certificate profile

7. Contributions:
- currently one hardcoded block with open-source stats and description

8. Footer CTA:
- "Get in Touch" section with mail link

## Logic and State Audit

### `src/Portfolio.js`
- `Header`
  - state: `scrollY`, `isVisible`
  - effect 1: on mount set visible
  - effect 2: `scroll` listener updates `scrollY` for parallax transform

- `TypewriterText`
  - state: `displayText`, `currentIndex`
  - effect: appends 1 char every `delay` ms until full text is rendered

- `AboutSection`
  - state: `activeTab` (`background` or `contact`)
  - data: inline `stats` and tab-content objects

- `AnimatedSection`
  - state: `isVisible`, `elementRef`
  - logic: `IntersectionObserver` toggles opacity/translate class on viewport entry

- `Portfolio` component
  - no global state/store
  - sequentially renders all sections with `AnimatedSection` wrappers

### `src/components/Projects.js`
- `ProjectCard` (memoized)
  - state: `isExpanded`
  - behavior: toggles text clamp and expanded details
  - external links: `project.github`, `project.demo`
- `ProjectsSection`
  - reads `projectsData.projects`
  - maps each project into `ProjectCard`
- image resolution uses string key mapping from JSON value to imported asset module

### `src/components/Experiences.js`
- stateless section rendering `experiencesData.experiences`
- timeline layout is purely UI-driven (no sorting logic; trusts JSON order)

### `src/components/Skills.js`
- state: `activeCategory`
- derived filtering:
  - all categories when `activeCategory === "all"`
  - only selected category otherwise
- skill-level color is computed by threshold:
  - `>= 85` green
  - `>= 70` blue
  - else purple

### `src/components/Certifications.js`
- state: `visibleCount` initialized to 6
- "See More" increases by 6
- linked action opens LinkedIn certifications page
- gradient header per card is generated from title hash

### `src/components/Contributions.js`
- static local array `contributions`
- no external data dependency

## Folder Structure Audit
```text
Portfolio/
  public/
    index.html                # HTML root shell
    manifest.json             # PWA metadata (mostly CRA defaults)
    portfolio.svg, icons...
  src/
    Portfolio.js              # Main app composition + shared UI logic
    index.js                  # React entry point (renders Portfolio)
    index.css                 # Tailwind directives + base body font
    App.js                    # CRA starter component (not app runtime)
    App.test.js               # CRA starter test (tests App.js, not Portfolio.js)
    reportWebVitals.js        # CRA default utility (unused)
    setupTests.js             # Jest setup
    components/
      Projects.js
      Experiences.js
      Skills.js
      Certifications.js
      Contributions.js
      Header.js               # Empty file (unused)
    data/
      projects.json
      experiences.json
      skills.json
      certifications.json
    assets/
      ProfilePic.png
      project images...
      Mootez_Aloui_Resume_EN.pdf
    styles/
      globals.css             # Not imported by runtime
      ProjectCard.css         # Not imported by runtime
  package.json
  tailwind.config.js
  postcss.config.js
  README.md
```

## Data Contract Summary

### `projects.json`
Each project object contains:
- `title`, `description`, `image`, `github`, `demo`
- `tags: string[]`
- `features: string[]`
- `technicalDetails: string`

### `experiences.json`
Each experience object contains:
- `title`, `company`, `period`
- `achievements: string[]`

### `skills.json`
Contains `skillCategories[]` where each category contains:
- `id`, `icon` (string mapped to lucide icon), `title`
- `skills[]` with `name`, `level` (0-100), `years`

### `certifications.json`
Each certification contains:
- `title`, `issuer`, `date`, `credentialId`, `image`, `skills[]`

## Build and Test Health Snapshot
- `npm run build`: succeeds with ESLint warnings for unused icon imports in `src/Portfolio.js`.
- `npm test -- --watchAll=false`: passes, but only validates default CRA `App.js` starter test.

## Risks / Inconsistencies to Know
1. Resume path risk:
- Resume links use a string path (`./assets/Mootez_Aloui_Resume_EN.pdf`) instead of importing asset.
- Build output does not include the PDF, so resume download/view can break in production.

2. Architecture mismatch with tracking docs:
- Repo state and stated phase architecture are not aligned.

3. Stale/unused files:
- `src/App.js`, `src/App.css`, `src/App.test.js`, `src/reportWebVitals.js`, `src/styles/*`, `src/components/Header.js` are not part of actual runtime flow.

4. Test coverage gap:
- No tests for `Portfolio.js` or section components.

5. UI-action gap:
- Certifications "View Certificate" button has no action handler.

6. Config cleanup item:
- duplicate `fade-in` key in `tailwind.config.js` animation object.

## Chatbot Bootstrap Prompt (Reusable)
Use this prompt when handing repo context to another assistant:

```text
You are auditing a React portfolio codebase in this exact path:
c:\Users\moote\OneDrive\Dokumente\GitHub\Portfolio

Important: treat current code as source of truth over planning docs.
Current implementation is CRA + JavaScript, not Vite + TypeScript.

Main runtime flow:
public/index.html -> src/index.js -> src/Portfolio.js

Portfolio.js composes sections:
Header, About, Projects, Experience, Skills, Certifications, Contributions, Contact CTA.

Section data comes from:
src/data/projects.json
src/data/experiences.json
src/data/skills.json
src/data/certifications.json

Known issues:
- resume PDF link uses string path and likely breaks in production
- tests are stale (App.js starter test only)
- unused leftover files exist from CRA starter setup

When suggesting changes, preserve the current single-page sectioned UX unless explicitly asked to re-architect.
```

