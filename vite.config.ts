import { readdirSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

const require = createRequire(import.meta.url);

function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted
                ? "https"
                : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

/** Resolve tslib package root for post-compile copy into the serverless function. */
function tslibPackageRoot(): string | null {
  try {
    return dirname(require.resolve("tslib/package.json"));
  } catch {
    return null;
  }
}

function copyTslibInto(dir: string, src: string) {
  const dest = join(dir, "node_modules", "tslib");
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("[nitro] copied tslib →", dest);
}

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: {
    tsconfigPaths: true,
    // Force Vite/Rollup to the ESM build of tslib when bundling.
    alias: {
      tslib: "tslib/tslib.es6.mjs",
    },
  },
  ssr: {
    // Bundle UI libs into the SSR graph instead of leaving bare imports.
    noExternal: ["tslib", /@radix-ui\//, "class-variance-authority", "cmdk", "vaul"],
  },
  plugins: [
    pgliteBootstrapPlugin(),
    authPopupPlugin(),
    appEnvPlugin(),
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    // Official TanStack Start + Vercel pattern: nitro() with no forced preset.
    // On Vercel CI, Nitro auto-selects the vercel preset.
    nitro({
      serverDir: "./server",
      // Prefer bundling over runtime node_modules resolution for UI deps.
      noExternals: ["tslib", /@radix-ui\//],
      alias: {
        tslib: "tslib/tslib.es6.mjs",
      },
      hooks: {
        // After the server is compiled, guarantee tslib exists where Node
        // resolves packages for /_libs/*.mjs (parent node_modules of the func).
        compiled(nitro: {
          options: { output: { dir: string; serverDir: string } };
        }) {
          const src = tslibPackageRoot();
          if (!src) {
            console.warn("[nitro] tslib not found in node_modules");
            return;
          }
          const outDir = nitro.options.output.dir;
          const serverDir = nitro.options.output.serverDir;
          // Vercel: .vercel/output/functions/__server.func
          // Also cover generic .output/server
          const candidates = [
            serverDir,
            join(outDir, "functions", "__server.func"),
            join(outDir, "server"),
            outDir,
          ];
          for (const dir of candidates) {
            if (dir && existsSync(dir)) copyTslibInto(dir, src);
          }
        },
      },
    }),
    viteReact(),
  ],
});
