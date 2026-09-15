#!/usr/bin/env node
/**
 * Safety net after vite build: put tslib where Node resolves bare imports
 * from /_libs/*.mjs inside the Vercel function.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let tslibSrc;
try {
  tslibSrc = dirname(require.resolve("tslib/package.json"));
} catch {
  console.warn("[vercel-include-tslib] tslib not installed — skip");
  process.exit(0);
}

function walk(dir, match, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    if (match(name, p)) out.push(p);
    // Do not descend into node_modules
    if (name === "node_modules") continue;
    walk(p, match, out);
  }
  return out;
}

const searchRoots = [
  join(root, ".vercel", "output"),
  join(root, ".output"),
];

const funcDirs = searchRoots.flatMap((r) =>
  walk(r, (name) => name.endsWith(".func")),
);
const libParents = searchRoots.flatMap((r) =>
  walk(r, (name) => name === "_libs").map((p) => dirname(p)),
);

const targets = new Set([...funcDirs, ...libParents]);

if (targets.size === 0) {
  console.log("[vercel-include-tslib] no function/_libs output found — skip");
  process.exit(0);
}

for (const dir of targets) {
  const dest = join(dir, "node_modules", "tslib");
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(tslibSrc, dest, { recursive: true });
  console.log("[vercel-include-tslib] copied →", dest);
}

console.log(`[vercel-include-tslib] done (${targets.size} target(s))`);
