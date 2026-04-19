import {
  Brain,
  Cloud,
  Code,
  Globe,
  Server,
  Shield,
  Users,
  Wrench,
} from "lucide-react";

import type { SkillCategory } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import { getRoleLensDefinition, type RoleLens } from "@/lib/lens/roleLens";

interface SkillsProps {
  categories: SkillCategory[];
  lens: RoleLens;
  locale: Locale;
}

const iconMap = {
  Brain,
  Cloud,
  Code,
  Globe,
  Server,
  Shield,
  Users,
};

function getLevelColor(level: number): string {
  if (level >= 85) return "bg-skill-high";
  if (level >= 70) return "bg-skill-mid";
  return "bg-skill-low";
}

export function Skills({ categories, lens, locale }: SkillsProps) {
  const lensDefinition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).skills;

  return (
    <section
      id="skills"
      data-mascot-anchor="section_skills"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
        <p className="text-xs text-muted">
          {formatMessage(dict.orderedBy, {
            role: lensDefinition.shortLabel,
          })}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const Icon =
            iconMap[category.icon as keyof typeof iconMap] ?? Wrench;

          return (
            <article
              key={category.id}
              className="rounded-2xl border border-border bg-background p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" />
                <h3 className="text-base font-semibold">{category.title}</h3>
              </div>
              <div className="space-y-3">
                {category.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted">
                      <span>{skill.name}</span>
                      <span>
                        {formatMessage(dict.yearsShort, { years: skill.years })}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full bg-progress-track"
                      role="progressbar"
                      aria-label={formatMessage(dict.proficiency, {
                        skill: skill.name,
                      })}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={skill.level}
                    >
                      <div
                        className={`h-full rounded-full ${getLevelColor(
                          skill.level
                        )}`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
