import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, "content", "twin");
const OUTPUT_PATH = join(CONTENT_DIR, "_index.json");
const DIMENSION = 256;
const MAX_CHUNK_WORDS = 140;

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[`*_#()[\]{}<>]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function hashTokenToBucket(token, dimension) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % dimension;
}

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

function embedText(text, dimension) {
  const vector = Array.from({ length: dimension }, () => 0);
  for (const token of tokenize(text)) {
    const bucket = hashTokenToBucket(token, dimension);
    vector[bucket] += 1;
  }
  return normalizeVector(vector);
}

function listMarkdownFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(absolutePath));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (!entry.name.endsWith(".md")) {
      continue;
    }
    files.push(absolutePath);
  }
  return files;
}

function stripFrontMatter(raw) {
  if (!raw.startsWith("---")) {
    return raw;
  }
  return raw.replace(/^---[\s\S]*?---\s*/m, "");
}

function splitByHeadings(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let currentHeading = "General";
  let currentLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)/);
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          text: currentLines.join("\n").trim(),
        });
      }
      currentHeading = headingMatch[1].trim();
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      text: currentLines.join("\n").trim(),
    });
  }

  return sections.filter((section) => section.text.length > 0);
}

function splitSectionToWordChunks(text, maxWords) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [text.trim()];
  }

  const chunks = [];
  for (let start = 0; start < words.length; start += maxWords) {
    const slice = words.slice(start, start + maxWords);
    chunks.push(slice.join(" ").trim());
  }
  return chunks;
}

function buildIndexChunk(filePath, heading, chunkText, chunkNumber) {
  const relPath = relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  const id = `${relPath}#${heading.toLowerCase().replace(/\s+/g, "-")}-${chunkNumber}`;
  return {
    id,
    sourceFile: relPath,
    heading,
    text: chunkText,
    tokenCount: tokenize(chunkText).length,
    embedding: embedText(chunkText, DIMENSION),
  };
}

function buildIndex() {
  const markdownFiles = listMarkdownFiles(CONTENT_DIR)
    .filter((file) => !file.endsWith("_index.json"))
    .filter((file) => !file.endsWith("projects/README.md"))
    .sort((a, b) => a.localeCompare(b));

  const chunks = [];

  for (const file of markdownFiles) {
    const markdown = stripFrontMatter(readFileSync(file, "utf-8"));
    const sections = splitByHeadings(markdown);
    for (const section of sections) {
      const subChunks = splitSectionToWordChunks(section.text, MAX_CHUNK_WORDS);
      subChunks.forEach((subChunk, index) => {
        if (subChunk.length === 0) {
          return;
        }
        chunks.push(buildIndexChunk(file, section.heading, subChunk, index + 1));
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    dimension: DIMENSION,
    chunkCount: chunks.length,
    chunks,
  };
}

function main() {
  const contentPath = resolve(CONTENT_DIR);
  if (!statSync(contentPath).isDirectory()) {
    throw new Error(`Twin content directory not found: ${contentPath}`);
  }

  const index = buildIndex();
  writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2) + "\n", "utf-8");

  console.info(
    `[twin-index] generated ${index.chunkCount} chunks at ${relative(ROOT, OUTPUT_PATH)}`
  );
}

main();
