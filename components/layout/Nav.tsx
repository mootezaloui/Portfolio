"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { buildLensHref, type RoleLens } from "@/lib/lens/roleLens";
import { buildHomeTabHref, type HomeTab } from "@/lib/navigation/homeTabs";
import { IS_STATIC_EXPORT } from "@/lib/site/runtime";
import { cn } from "@/lib/utils";

interface NavProps {
  lens: RoleLens;
  activeTab: HomeTab;
  locale: Locale;
}

export function Nav({ lens, activeTab, locale }: NavProps) {
  const [hashTab, setHashTab] = useState<HomeTab>(activeTab);
  const dict = getDictionary(locale).nav;
  const navItems = [
    { tab: "why-me" as const, label: dict.whyMe },
    { tab: "projects" as const, label: dict.projects },
    { tab: "experience" as const, label: dict.experience },
    { tab: "skills" as const, label: dict.skills },
    { tab: "contact" as const, label: dict.contact },
  ];
  const selectedTab = IS_STATIC_EXPORT ? hashTab : activeTab;

  useEffect(() => {
    if (!IS_STATIC_EXPORT || typeof window === "undefined") {
      return;
    }

    const resolveHashTab = () => {
      const hash = window.location.hash.replace(/^#/, "");
      const mapped =
        hash === "projects" ||
        hash === "experience" ||
        hash === "skills" ||
        hash === "contact"
          ? hash
          : "why-me";
      setHashTab(mapped);
    };

    resolveHashTab();
    window.addEventListener("hashchange", resolveHashTab);
    return () => window.removeEventListener("hashchange", resolveHashTab);
  }, []);

  const tabPillClassName = (isActive: boolean) =>
    cn(
      "relative block rounded-full px-3 py-1.5 transition-colors duration-200",
      isActive ? "text-foreground" : "text-muted hover:text-foreground"
    );

  return (
    <nav
      aria-label={dict.primaryLabel}
      className="rounded-2xl border border-border bg-surface px-4 py-3"
    >
      <ul className="flex flex-wrap items-center gap-3 text-sm">
        {navItems.map((item) => {
          const isActive = selectedTab === item.tab;
          const pillInner = (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 z-0 rounded-full bg-background shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </>
          );
          return (
            <li key={item.tab} className="relative">
              {IS_STATIC_EXPORT ? (
                <a
                  href={`#${item.tab}`}
                  className={tabPillClassName(isActive)}
                >
                  {pillInner}
                </a>
              ) : (
                <Link
                  href={buildHomeTabHref(item.tab, lens) as Route}
                  className={tabPillClassName(isActive)}
                >
                  {pillInner}
                </Link>
              )}
            </li>
          );
        })}
        <li className="ml-auto">
          <Link
            href={buildLensHref("/twin", lens) as Route}
            className="rounded-full border border-border px-3 py-1.5 text-muted transition hover:bg-background hover:text-foreground"
          >
            {dict.askAssistant}
          </Link>
        </li>
        <li>
          {IS_STATIC_EXPORT ? (
            <a
              href="#contact"
              className="rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-foreground transition hover:opacity-90"
            >
              {dict.hireMe}
            </a>
          ) : (
            <Link
              href={buildHomeTabHref("contact", lens) as Route}
              className="rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-foreground transition hover:opacity-90"
            >
              {dict.hireMe}
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
