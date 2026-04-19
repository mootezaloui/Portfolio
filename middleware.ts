import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { detectAgentRequest } from "@/lib/agents/detect";
import {
  LOCALE_COOKIE,
  parseAcceptLanguage,
  resolveLocale,
} from "@/lib/i18n/config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isInternalRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/agent") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt";

  const isStaticAsset = /\.[a-z0-9]+$/i.test(pathname);
  if (isInternalRoute || isStaticAsset) {
    return NextResponse.next();
  }

  const detection = detectAgentRequest({
    userAgent: request.headers.get("user-agent"),
    pathname,
    query: request.nextUrl.searchParams,
    accept: request.headers.get("accept"),
    secFetchMode: request.headers.get("sec-fetch-mode"),
    secChUa: request.headers.get("sec-ch-ua"),
    hasCookieHeader: request.cookies.getAll().length > 0,
  });

  if (
    detection.isAgent &&
    request.method === "GET" &&
    !request.nextUrl.searchParams.has("human")
  ) {
    const agentUrl = request.nextUrl.clone();
    agentUrl.pathname = "/agent";
    const response = NextResponse.rewrite(agentUrl);
    response.headers.set("x-agent-gauntlet", "rewrite");
    response.headers.set("x-agent-band", detection.band);
    response.headers.set("x-agent-confidence", detection.confidence.toFixed(2));
    return response;
  }

  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const response =
    detection.band === "medium" ? NextResponse.next() : NextResponse.next();

  if (detection.band === "medium") {
    response.headers.set("x-agent-gauntlet", "candidate");
    response.headers.set("x-agent-band", detection.band);
    response.headers.set("x-agent-confidence", detection.confidence.toFixed(2));
  }

  if (!existingLocale) {
    const detected = parseAcceptLanguage(request.headers.get("accept-language"));
    response.cookies.set({
      name: LOCALE_COOKIE,
      value: detected,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } else {
    const normalized = resolveLocale(existingLocale);
    if (normalized !== existingLocale) {
      response.cookies.set({
        name: LOCALE_COOKIE,
        value: normalized,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
