"use client";

import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import { Sliders } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  buildLensHref,
  getRoleLensDefinitions,
  type RoleLens,
} from "@/lib/lens/roleLens";
import { cn } from "@/lib/utils";

interface LensSelectorProps {
  currentLens: RoleLens;
  basePath: string;
  locale: Locale;
  className?: string;
}

export function LensSelector({
  currentLens,
  basePath,
  locale,
  className,
}: LensSelectorProps) {
  const definitions = getRoleLensDefinitions(locale);
  const dict = getDictionary(locale).lens;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface px-5 py-4",
        className
      )}
      aria-label={dict.adaptAria}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-foreground">
            {dict.viewByRole}
          </p>
        </div>
        <p className="text-xs text-muted">{dict.adaptToHiring}</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {definitions.map((definition) => {
          const isActive = definition.id === currentLens;
          return (
            <li key={definition.id} className="relative">
              <Link
                href={buildLensHref(basePath, definition.id) as Route}
                className={cn(
                  "relative inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  isActive
                    ? "border-accent text-accent-foreground"
                    : "border-border bg-background text-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                title={definition.description}
              >
                {isActive && (
                  <motion.div
                    layoutId="lens-pill"
                    className="absolute inset-0 z-0 rounded-full bg-accent"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{definition.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
