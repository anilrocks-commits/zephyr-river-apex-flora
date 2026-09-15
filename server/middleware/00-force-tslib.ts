/**
 * Force node-file-trace to include `tslib` in the Vercel serverless bundle.
 *
 * Nitro puts @radix-ui packages under /_libs/*.mjs with bare `import "tslib"`.
 * NFT does not follow those imports, so tslib is missing at runtime unless
 * something in the server graph imports it directly. This middleware is a no-op
 * at request time; it only exists for the static import.
 */
import "tslib";

export default defineEventHandler(() => {
  // no-op — import above is the whole point
});

// Nitro auto-imports defineEventHandler; declare for TypeScript in this thin file.
declare function defineEventHandler(handler: () => void): unknown;
