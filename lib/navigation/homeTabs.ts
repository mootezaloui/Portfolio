import type { RoleLens } from "../lens/roleLens";

export const HOME_TABS = [
  "why-me",
  "projects",
  "experience",
  "skills",
  "contact",
] as const;

export type HomeTab = (typeof HOME_TABS)[number];

export const DEFAULT_HOME_TAB: HomeTab = "why-me";

export function parseHomeTab(value: string | null | undefined): HomeTab {
  if (!value) {
    return DEFAULT_HOME_TAB;
  }

  const normalized = value.trim().toLowerCase();
  const match = HOME_TABS.find((tab) => tab === normalized);
  return match ?? DEFAULT_HOME_TAB;
}

export function getHomeTabFromSearchParams(searchParams: {
  tab?: string | string[];
}): HomeTab {
  const rawTab = Array.isArray(searchParams.tab)
    ? searchParams.tab[0]
    : searchParams.tab;
  return parseHomeTab(rawTab);
}

export function buildHomeTabHref(tab: HomeTab, lens: RoleLens): string {
  const params = new URLSearchParams();

  if (lens !== "general") {
    params.set("lens", lens);
  }

  if (tab !== DEFAULT_HOME_TAB) {
    params.set("tab", tab);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

