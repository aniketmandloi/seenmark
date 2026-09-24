import { defineConfig } from "tsdown";
import { encryptEnvBlobSync } from "varlock/encrypt-env";
import { execSyncVarlock } from "varlock/exec-sync-varlock";

// Vercel runs dist/index.mjs from the function root, where neither the varlock
// CLI nor .env.schema exist, so the resolved env is baked in at build time the
// same way @varlock/nextjs-integration does for the web app. auto-load reuses
// the blob, decrypting it with the runtime _VARLOCK_ENV_KEY.
function vercelEnvBanner() {
  const key = process.env._VARLOCK_ENV_KEY;
  if (!key) {
    throw new Error("_VARLOCK_ENV_KEY must be set on Vercel to encrypt the server env");
  }
  const blob = execSyncVarlock("load --format json-full --compact", {
    env: { ...process.env, NODE_ENV: "production" },
  });
  const encrypted = JSON.stringify(encryptEnvBlobSync(blob.trim(), key));
  return `process.env.__VARLOCK_ENV ||= ${encrypted};\nprocess.env._VARLOCK_USE_INJECTED_ENV ||= "1";`;
}

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  // Everything goes into one file: Vercel relocates dist/index.mjs away from
  // node_modules, and the env banner must run before varlock's auto-load, which
  // an import of an external package or a split chunk would hoist above it.
  deps: {
    alwaysBundle: [/./],
  },
  outputOptions: {
    codeSplitting: false,
  },
  shims: true,
  banner: process.env.VERCEL ? vercelEnvBanner() : undefined,
});
