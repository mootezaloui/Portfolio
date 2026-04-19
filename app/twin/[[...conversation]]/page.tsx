import type { Route } from "next";
import Link from "next/link";

import { LensContextBanner } from "@/components/lens/LensContextBanner";
import { LensSelector } from "@/components/lens/LensSelector";
import { TwinPanel } from "@/components/twin/TwinPanel";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/getLocale";
import { buildLensHref, getLensFromSearchParams } from "@/lib/lens/roleLens";

interface TwinConversationPageProps {
  params: Promise<{ conversation?: string[] }>;
  searchParams: Promise<{ snapshot?: string; lens?: string | string[] }>;
}

export function generateStaticParams() {
  return [{ conversation: [] }];
}

export default async function TwinConversationPage({
  params,
  searchParams,
}: TwinConversationPageProps) {
  const { conversation } = await params;
  const resolvedSearchParams = await searchParams;
  const { snapshot } = resolvedSearchParams;
  const lens = getLensFromSearchParams(resolvedSearchParams);
  const locale = await getLocale();
  const dict = getDictionary(locale).twin;

  const conversationId = conversation?.[0];
  const initialSnapshot = typeof snapshot === "string" ? snapshot : undefined;
  const lensBasePath = conversationId ? `/twin/${conversationId}` : "/twin";
  const twinPanelProps = {
    standalone: true,
    className: "mx-auto w-full max-w-4xl",
    ...(conversationId ? { initialConversationId: conversationId } : {}),
    ...(initialSnapshot ? { initialSnapshot } : {}),
    initialLens: lens,
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            {dict.tag}
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {dict.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{dict.description}</p>
        </div>
        <Link
          href={buildLensHref("/", lens) as Route}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted transition hover:bg-background hover:text-foreground"
        >
          {dict.backToPortfolio}
        </Link>
      </div>
      <div className="mx-auto mb-4 w-full max-w-4xl space-y-4">
        <LensSelector
          currentLens={lens}
          basePath={lensBasePath}
          locale={locale}
        />
        <LensContextBanner lens={lens} locale={locale} />
      </div>
      <TwinPanel {...twinPanelProps} />
    </main>
  );
}
