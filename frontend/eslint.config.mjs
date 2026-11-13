import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // TODO(debt): ~150 `any` usages pre-date this config. Downgraded to a
      // warning so lint stays green while types are tightened incrementally.
      // Switch back to "error" once the DOM/API types are fully modeled.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
