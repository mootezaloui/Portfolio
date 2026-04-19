"use client";

import { useEffect, useState, type ReactNode } from "react";

import { parseHomeTab, type HomeTab } from "@/lib/navigation/homeTabs";

interface HomeTabPanelsProps {
  initialTab: HomeTab;
  useHashNavigation?: boolean;
  whyMe: ReactNode;
  projects: ReactNode;
  experience: ReactNode;
  skills: ReactNode;
  contact: ReactNode;
}

function resolveHashTab(): HomeTab {
  if (typeof window === "undefined") {
    return "why-me";
  }

  const raw = window.location.hash.replace(/^#/, "");
  return parseHomeTab(raw);
}

export function HomeTabPanels({
  initialTab,
  useHashNavigation = false,
  whyMe,
  projects,
  experience,
  skills,
  contact,
}: HomeTabPanelsProps) {
  const [hashTab, setHashTab] = useState<HomeTab>(initialTab);

  useEffect(() => {
    if (!useHashNavigation) {
      return;
    }

    const updateTab = () => setHashTab(resolveHashTab());
    updateTab();
    window.addEventListener("hashchange", updateTab);
    return () => window.removeEventListener("hashchange", updateTab);
  }, [useHashNavigation]);

  const selectedTab = useHashNavigation ? hashTab : initialTab;

  switch (selectedTab) {
    case "projects":
      return <>{projects}</>;
    case "experience":
      return <>{experience}</>;
    case "skills":
      return <>{skills}</>;
    case "contact":
      return <>{contact}</>;
    case "why-me":
    default:
      return <>{whyMe}</>;
  }
}
