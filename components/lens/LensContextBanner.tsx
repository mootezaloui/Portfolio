import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import { getRoleLensDefinition, type RoleLens } from "@/lib/lens/roleLens";

interface LensContextBannerProps {
  lens: RoleLens;
  locale: Locale;
  className?: string;
}

export function LensContextBanner({
  lens,
  locale,
  className,
}: LensContextBannerProps) {
  if (lens === "general") {
    return null;
  }

  const definition = getRoleLensDefinition(lens, locale);
  const dict = getDictionary(locale).lens;

  return (
    <section
      className={[
        "rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3",
        className ?? "",
      ].join(" ")}
      aria-label={formatMessage(dict.viewAria, { role: definition.label })}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        {dict.viewingAs} · {definition.label}
      </p>
      <p className="mt-1 text-sm text-muted">{definition.description}</p>
    </section>
  );
}
