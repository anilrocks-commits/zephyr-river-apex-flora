#!/usr/bin/env node
/**
 * After `vite build` (Nitro vercel preset), copy `tslib` into every serverless
 * function directory so bare `import "tslib"` from /_libs chunks resolve.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tslibSrc = join(root, "node_modules", "tslib");
const vercelOut = join(root, ".vercel", "output", "functions");

if (!existsSync(tslibSrc)) {
  console.warn("[vercel-include-tslib] node_modules/tslib missing — skip");
  process.exit(0);
}

if (!existsSync(vercelOut)) {
  // Local builds without vercel output are fine
  console.log("[vercel-include-tslib] no .vercel/output/functions — skip");
  process.exit(0);
}

function walkFuncs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.endsWith(".func")) out.push(p);
    else walkFuncs(p, out);
  }
  return out;
}

const funcs = walkFuncs(vercelOut);
let n = 0;
for (const funcDir of funcs) {
  const dest = join(funcDir, "node_modules", "tslib");
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(tslibSrc, dest, { recursive: true });
  n += 1;
  console.log(`[vercel-include-tslib] copied tslib → ${dest}`);
}

console.log(`[vercel-include-tslib] done (${n} function(s))`);
