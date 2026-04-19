"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ComponentType } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeSwitcherProps {
  className?: string;
}

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function normalizeTheme(value: string | undefined): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? normalizeTheme(theme) : "system";

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1",
        className
      )}
      role="group"
      aria-label="Theme preference"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={isActive}
            disabled={!mounted}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
              isActive ? "text-accent-foreground" : "text-muted hover:text-foreground",
              !mounted && "cursor-not-allowed opacity-70"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="theme-pill"
                className="absolute inset-0 z-0 rounded-full bg-accent"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
