import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { TwinCorpusContext } from "./prompt";

const CONTENT_DIR = join(process.cwd(), "content", "twin");

let cachedCorpus: TwinCorpusContext | null = null;
let cachedDeflections: string | null = null;

function readCorpusFile(filename: string): string {
  return readFileSync(join(CONTENT_DIR, filename), "utf-8");
}

export function loadTwinCorpusContext(): TwinCorpusContext {
  if (cachedCorpus) {
    return cachedCorpus;
  }

  cachedCorpus = {
    voiceSpec: readCorpusFile("voice.md"),
    approach: readCorpusFile("approach.md"),
    career: readCorpusFile("career.md"),
    opinions: readCorpusFile("opinions.md"),
  };

  return cachedCorpus;
}

export function loadTwinDeflectionsRaw(): string {
  if (cachedDeflections) {
    return cachedDeflections;
  }

  cachedDeflections = readCorpusFile("deflections.md");
  return cachedDeflections;
}

export function clearTwinCorpusCache(): void {
  cachedCorpus = null;
  cachedDeflections = null;
}
