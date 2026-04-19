import type { ReactNode } from "react";

import type { HomeTab } from "@/lib/navigation/homeTabs";

interface HomeTabPanelsProps {
  activeTab: HomeTab;
  whyMe: ReactNode;
  projects: ReactNode;
  experience: ReactNode;
  skills: ReactNode;
  contact: ReactNode;
}

export function HomeTabPanels({
  activeTab,
  whyMe,
  projects,
  experience,
  skills,
  contact,
}: HomeTabPanelsProps) {
  switch (activeTab) {
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
