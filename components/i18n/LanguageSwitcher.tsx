"use client";

import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

import { useLocale } from "./LocaleProvider";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ariaLabel = getDictionary(locale).common.localeLabel;

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1",
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="flex items-center">
        <Languages
          className="mx-1.5 h-3.5 w-3.5 text-muted"
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center gap-1">
        {LOCALES.map((value) => {
          const isActive = locale === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setLocale(value)}
              aria-pressed={isActive}
              disabled={!mounted}
              className={cn(
                "relative inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                isActive ? "text-accent-foreground" : "text-muted hover:text-foreground",
                !mounted && "cursor-not-allowed opacity-70"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="language-pill"
                  className="absolute inset-0 z-0 rounded-full bg-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{LOCALE_LABELS[value]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
