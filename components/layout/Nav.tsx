"use client";

import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { buildLensHref, type RoleLens } from "@/lib/lens/roleLens";
import { buildHomeTabHref, type HomeTab } from "@/lib/navigation/homeTabs";
import { cn } from "@/lib/utils";

interface NavProps {
  lens: RoleLens;
  activeTab: HomeTab;
  locale: Locale;
}

export function Nav({ lens, activeTab, locale }: NavProps) {
  const dict = getDictionary(locale).nav;
  const navItems = [
    { tab: "why-me" as const, label: dict.whyMe },
    { tab: "projects" as const, label: dict.projects },
    { tab: "experience" as const, label: dict.experience },
    { tab: "skills" as const, label: dict.skills },
    { tab: "contact" as const, label: dict.contact },
  ];

  return (
    <nav
      aria-label={dict.primaryLabel}
      className="rounded-2xl border border-border bg-surface px-4 py-3"
    >
      <ul className="flex flex-wrap items-center gap-3 text-sm">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <li key={item.tab} className="relative">
              <Link
                href={buildHomeTabHref(item.tab, lens) as Route}
                className={cn(
                  "relative block rounded-full px-3 py-1.5 transition-colors duration-200",
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 z-0 rounded-full bg-background shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
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
          <Link
            href={buildHomeTabHref("contact", lens) as Route}
            className="rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-foreground transition hover:opacity-90"
          >
            {dict.hireMe}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
