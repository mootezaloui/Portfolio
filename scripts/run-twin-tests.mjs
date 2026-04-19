import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const tscCommand =
  process.platform === "win32"
    ? ".\\node_modules\\.bin\\tsc.cmd -p tsconfig.twin-tests.json"
    : "./node_modules/typescript/bin/tsc -p tsconfig.twin-tests.json";

rmSync(".test-dist", { recursive: true, force: true });

execSync(tscCommand, { stdio: "inherit", shell: true });
execSync("node --test .test-dist/tests/twin", { stdio: "inherit", shell: true });
rmSync(".test-dist", { recursive: true, force: true });
