import type { Metadata } from "next";
import { Suspense } from "react";

import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MascotBehaviorTracker } from "@/components/twin/MascotBehaviorTracker";
import { TwinMascot } from "@/components/twin/TwinMascot";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/getLocale";

import "./globals.css";

const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL("https://tazou-runtime.vercel.app"),
    title: {
      default: dict.meta.siteTitle,
      template: `%s | ${dict.meta.siteTitle}`,
    },
    description: dict.meta.siteDescription,
    keywords: [
      "Mootez Aloui",
      "Software Engineer",
      "AI Engineering",
      "Machine Learning",
      "Cybersecurity",
      "AI Security",
      "Software Architect",
      "Digital Twin",
      "Tazou Runtime",
    ],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.ogDescription,
      url: "/",
      siteName: dict.meta.siteTitle,
      locale: OG_LOCALE[locale] ?? "en_US",
      type: "website",
      images: [
        {
          url: "/avatar.png",
          width: 1200,
          height: 1200,
          alt: `${dict.meta.siteTitle} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.siteTitle,
      description: dict.meta.twitterDescription,
      images: ["/avatar.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            enableSystem
            storageKey="tazou-runtime-theme"
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
            >
              {dict.common.skipToMain}
            </a>
            {children}
            <Suspense fallback={null}>
              <MascotBehaviorTracker />
              <TwinMascot />
            </Suspense>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
