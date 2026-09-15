#!/usr/bin/env node
/**
 * Safety net after Nitro build: only fill missing Build Output API files.
 * Never overwrite Nitro's config.json / .vc-config.json — those are complete.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".vercel", "output");
const funcDir = join(out, "functions", "__server.func");
const configPath = join(out, "config.json");
const vcConfigPath = join(funcDir, ".vc-config.json");

if (!existsSync(out)) {
  console.error("[vercel-ensure-boa] .vercel/output missing — build did not run");
  process.exit(1);
}

if (!existsSync(funcDir)) {
  console.error("[vercel-ensure-boa] __server.func missing — Nitro did not emit a function");
  process.exit(1);
}

if (!existsSync(configPath)) {
  const config = {
    version: 3,
    framework: { name: "nitro", version: "3" },
    routes: [
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/__server" },
    ],
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[vercel-ensure-boa] wrote missing", configPath);
} else {
  console.log("[vercel-ensure-boa] kept existing", configPath);
}

if (!existsSync(vcConfigPath)) {
  const vc = {
    runtime: "nodejs22.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    shouldAddHelpers: false,
    supportsResponseStreaming: true,
  };
  mkdirSync(dirname(vcConfigPath), { recursive: true });
  writeFileSync(vcConfigPath, JSON.stringify(vc, null, 2));
  console.log("[vercel-ensure-boa] wrote missing", vcConfigPath);
} else {
  console.log("[vercel-ensure-boa] kept existing", vcConfigPath);
}

const index = join(funcDir, "index.mjs");
if (!existsSync(index)) {
  console.error("[vercel-ensure-boa] missing", index);
  process.exit(1);
}

console.log("[vercel-ensure-boa] OK — Build Output API ready");
