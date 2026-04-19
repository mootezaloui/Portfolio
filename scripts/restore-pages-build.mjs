import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, ".pages-build-manifest.json");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(manifestPath))) {
    console.log("No Pages build manifest found. Nothing to restore.");
    return;
  }

  const rawManifest = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(rawManifest);
  const movedEntries = Array.isArray(manifest?.moved) ? manifest.moved : [];

  for (const entry of [...movedEntries].reverse()) {
    if (!entry?.from || !entry?.to) {
      continue;
    }
    const fromPath = path.join(repoRoot, entry.from);
    const toPath = path.join(repoRoot, entry.to);
    if (!(await exists(toPath))) {
      continue;
    }
    if (await exists(fromPath)) {
      await fs.rm(fromPath, { recursive: true, force: true });
    }
    await fs.rename(toPath, fromPath);
  }

  await fs.rm(manifestPath, { force: true });
  console.log("Restored server-only files after Pages build.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
