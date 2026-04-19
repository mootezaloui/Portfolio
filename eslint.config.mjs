import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      "out/**",
      "build/**",
      ".test-dist/**",
      "next-env.d.ts",
      "archive/**",
    ],
  },
];

export default config;
