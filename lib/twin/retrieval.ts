import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface TwinIndexedChunk {
  id: string;
  sourceFile: string;
  heading: string;
  text: string;
  tokenCount: number;
  embedding: number[];
}

export interface TwinIndexDocument {
  generatedAt: string;
  dimension: number;
  chunkCount: number;
  chunks: TwinIndexedChunk[];
}

export interface RetrievedChunk {
  id: string;
  sourceFile: string;
  heading: string;
  text: string;
  score: number;
}

export interface RetrieveTwinContextOptions {
  topK?: number;
}

const DEFAULT_DIMENSION = 256;

let cachedIndex: TwinIndexDocument | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[`*_#()[\]{}<>]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function hashTokenToBucket(token: string, dimension: number): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % dimension;
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0)
  );
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

function embedText(text: string, dimension: number): number[] {
  const vector = Array.from({ length: dimension }, () => 0);
  for (const token of tokenize(text)) {
    const bucket = hashTokenToBucket(token, dimension);
    vector[bucket] = (vector[bucket] ?? 0) + 1;
  }
  return normalizeVector(vector);
}

function cosineSimilarity(left: number[], right: number[]): number {
  const dimension = Math.min(left.length, right.length);
  let dot = 0;
  for (let index = 0; index < dimension; index += 1) {
    dot += (left[index] ?? 0) * (right[index] ?? 0);
  }
  return dot;
}

export function loadTwinIndex(): TwinIndexDocument {
  if (cachedIndex) {
    return cachedIndex;
  }

  const indexPath = join(process.cwd(), "content", "twin", "_index.json");
  const raw = readFileSync(indexPath, "utf-8");
  const parsed = JSON.parse(raw) as TwinIndexDocument;
  cachedIndex = parsed;
  return parsed;
}

export function retrieveTwinContext(
  query: string,
  options: RetrieveTwinContextOptions = {}
): RetrievedChunk[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const index = loadTwinIndex();
  const dimension = index.dimension || DEFAULT_DIMENSION;
  const queryVector = embedText(trimmed, dimension);
  const topK = options.topK ?? 5;

  return index.chunks
    .map((chunk) => {
      const chunkVector =
        chunk.embedding.length > 0
          ? normalizeVector(chunk.embedding)
          : embedText(chunk.text, dimension);

      return {
        id: chunk.id,
        sourceFile: chunk.sourceFile,
        heading: chunk.heading,
        text: chunk.text,
        score: cosineSimilarity(queryVector, chunkVector),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function clearTwinIndexCache(): void {
  cachedIndex = null;
}
