import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npm" : "npm";

const steps = [
  { label: "Lint", args: ["run", "lint"] },
  { label: "Typecheck", args: ["run", "typecheck"] },
  { label: "Twin Tests", args: ["run", "test:twin"] },
  { label: "Build", args: ["run", "build"] },
];

function runStep(step) {
  console.log(`\n[launch-check] ${step.label}...`);
  const result = spawnSync(command, step.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error(`[launch-check] ${step.label} failed.`);
    process.exit(result.status ?? 1);
  }

  console.log(`[launch-check] ${step.label} passed.`);
}

console.log("[launch-check] Starting launch readiness checks.");
for (const step of steps) {
  runStep(step);
}
console.log("\n[launch-check] All checks passed.");
