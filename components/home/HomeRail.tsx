"use client";

import { useEffect, useState } from "react";

import {
  OnThisPageRail,
  type OnPageItem,
} from "@/components/layout/OnThisPageRail";
import { parseHomeTab, type HomeTab } from "@/lib/navigation/homeTabs";

interface HomeRailProps {
  title: string;
  baseItem: OnPageItem;
  itemsByTab: Record<HomeTab, OnPageItem[]>;
  initialTab?: HomeTab;
}

function resolveHashTab(fallback: HomeTab): HomeTab {
  if (typeof window === "undefined") {
    return fallback;
  }
  return parseHomeTab(window.location.hash.replace(/^#/, ""));
}

export function HomeRail({
  title,
  baseItem,
  itemsByTab,
  initialTab = "why-me",
}: HomeRailProps) {
  const [tab, setTab] = useState<HomeTab>(initialTab);

  useEffect(() => {
    const update = () => setTab(resolveHashTab(initialTab));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [initialTab]);

  const items = [baseItem, ...(itemsByTab[tab] ?? [])];
  return <OnThisPageRail title={title} items={items} />;
}
