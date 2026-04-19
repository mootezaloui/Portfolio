"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useRef, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

export interface OnPageItem {
  id: string;
  label: string;
  level?: 1 | 2;
}

interface OnThisPageRailProps {
  title: string;
  items: OnPageItem[];
}

export const MASCOT_RAIL_FOCUS_EVENT = "mascot:rail-focus" as const;

export interface MascotRailFocusEventDetail {
  id: string;
  source: "click" | "scroll";
}

const ACTIVE_TARGET_OFFSET = 150;

function dispatchMascotRailFocus(detail: MascotRailFocusEventDetail): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<MascotRailFocusEventDetail>(MASCOT_RAIL_FOCUS_EVENT, {
      detail,
    })
  );
}

export function OnThisPageRail({ title, items }: OnThisPageRailProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const sectionIds = useMemo(() => items.map((item) => item.id), [items]);

  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollFocusIdRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveId(items[0]?.id ?? "");
  }, [items]);

  useEffect(() => {
    if (sectionIds.length === 0) {
      return;
    }

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    if (sections.length === 0) {
      return;
    }

    const resolveClosestId = (): string | null => {
      if (sections.length === 0) return null;

      // Force the last item if the user has reached the bottom bounds
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;

      if (isAtBottom) {
        return sectionIds.at(-1) ?? null;
      }

      const firstSection = sections[0];
      if (!firstSection) {
        return null;
      }

      let closestId = firstSection.id;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const distance = Math.abs(
          section.getBoundingClientRect().top - ACTIVE_TARGET_OFFSET
        );

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestId = section.id;
        }
      }

      return closestId;
    };

    const applyScrollFocus = (dispatchOnChange: boolean) => {
      const closestId = resolveClosestId();
      if (!closestId) return;

      setActiveId((current) => (current === closestId ? current : closestId));

      if (
        dispatchOnChange &&
        lastScrollFocusIdRef.current !== closestId
      ) {
        dispatchMascotRailFocus({ id: closestId, source: "scroll" });
      }
      lastScrollFocusIdRef.current = closestId;
    };

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      applyScrollFocus(true);
    };

    const handleResize = () => {
      applyScrollFocus(false);
    };

    // Initialize the active item once on mount (no dispatch — initial state, not a user action)
    applyScrollFocus(false);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [sectionIds]);

  function handleSelect(id: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const target = document.getElementById(id);
      if (!target) {
        return;
      }

      isProgrammaticScrollRef.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", `#${id}`);
      setActiveId(id);
      lastScrollFocusIdRef.current = id;
      dispatchMascotRailFocus({ id, source: "click" });

      // Lock out the observer for 800ms while the browser finishes smooth scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 800);
    };
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={title}>
      <p className="mb-3 text-[11px] tracking-[0.16em] text-muted uppercase">
        {title}
      </p>
      <ul className="relative border-l border-border pl-4">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <li
              key={item.id}
              className={cn("relative py-1.5", item.level === 2 ? "pl-3" : "")}
            >
              {isActive ? (
                <motion.span
                  layoutId="on-page-indicator"
                  className="absolute top-1/2 -left-[17px] h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                  }}
                />
              ) : null}
              <a
                href={`#${item.id}`}
                onClick={handleSelect(item.id)}
                className={cn(
                  "block text-[15px] leading-6 transition-colors duration-200",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                <motion.span
                  className="inline-block"
                  animate={isActive ? { x: 3 } : { x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  {item.label}
                </motion.span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
