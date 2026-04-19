import { createHash } from "node:crypto";

import type { RoleLens } from "../lens/roleLens";

export interface CachedTwinResponse {
  response: string;
  providerId: string;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const responseCache = new Map<string, CachedTwinResponse>();

function clearExpiredEntries(now: number): void {
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);
    }
  }
}

export function buildTwinCacheKey(
  message: string,
  roleLens: RoleLens = "general"
): string {
  const normalized = message.trim().toLowerCase().replace(/\s+/g, " ");
  const scopedKey = `${roleLens}::${normalized}`;
  return createHash("sha256").update(scopedKey).digest("hex");
}

export function getCachedTwinResponse(key: string): CachedTwinResponse | null {
  const now = Date.now();
  clearExpiredEntries(now);
  const hit = responseCache.get(key);
  if (!hit) {
    return null;
  }
  return hit;
}

export function setCachedTwinResponse(
  key: string,
  value: Omit<CachedTwinResponse, "expiresAt">,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  responseCache.set(key, {
    ...value,
    expiresAt: value.createdAt + ttlMs,
  });
}

export function clearTwinResponseCache(): void {
  responseCache.clear();
}
