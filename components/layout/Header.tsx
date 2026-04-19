import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Nav } from "@/components/layout/Nav";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { RoleLens } from "@/lib/lens/roleLens";
import type { HomeTab } from "@/lib/navigation/homeTabs";

interface HeaderProps {
  lens: RoleLens;
  activeTab: HomeTab;
  locale: Locale;
  name?: string;
}

export function Header({ lens, activeTab, locale, name }: HeaderProps) {
  const dict = getDictionary(locale).header;
  return (
    <header className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {name ?? "Mootez Aloui"}
          </p>
          <p className="text-xs text-muted">{dict.taglineFallback}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
      <Nav lens={lens} activeTab={activeTab} locale={locale} />
    </header>
  );
}
