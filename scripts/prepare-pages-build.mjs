import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "app");
const manifestPath = path.join(repoRoot, ".pages-build-manifest.json");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectRouteFiles(dir, files) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectRouteFiles(entryPath, files);
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      files.push(entryPath);
    }
  }
}

async function main() {
  const routeFiles = [];
  if (await exists(appDir)) {
    await collectRouteFiles(appDir, routeFiles);
  }

  const targets = [...routeFiles];
  const middlewarePath = path.join(repoRoot, "middleware.ts");
  if (await exists(middlewarePath)) {
    targets.push(middlewarePath);
  }

  const moved = [];
  for (const fromPath of targets) {
    const toPath = `${fromPath}.pages-disabled`;
    if (await exists(toPath)) {
      await fs.rm(toPath, { force: true, recursive: true });
    }
    await fs.rename(fromPath, toPath);
    moved.push({
      from: path.relative(repoRoot, fromPath).replaceAll("\\", "/"),
      to: path.relative(repoRoot, toPath).replaceAll("\\", "/"),
    });
  }

  await fs.writeFile(manifestPath, JSON.stringify({ moved }, null, 2));
  console.log(`Prepared GitHub Pages static build. Disabled ${moved.length} server-only files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
