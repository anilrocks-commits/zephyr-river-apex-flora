#!/usr/bin/env node
/**
 * Clippd college golf scraper
 * ---------------------------
 * Pulls team schedule + recent tournament results from scoreboard.clippd.com
 * for the programs tracked in programs.ts.
 *
 * Output: public/data/live-results.json
 *
 * Usage:
 *   node scripts/scrape-clippd.mjs
 *   node scripts/scrape-clippd.mjs --headful   # debug with visible browser
 *
 * Designed to run daily via GitHub Actions. Playwright is already a
 * devDependency of this repo.
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data");
const OUT_FILE = join(OUT_DIR, "live-results.json");

// ---------------------------------------------------------------------------
// Programs we care about (keep in sync with src/data/programs.ts clippd IDs)
// ---------------------------------------------------------------------------
const TEAMS = [
  { id: "siu", name: "Southern Illinois", clippdId: "4127" },
  { id: "ksu", name: "Kennesaw State", clippdId: "4172" },
  { id: "shu", name: "Seton Hall", clippdId: "3163" },
  { id: "ucsb", name: "UC Santa Barbara", clippdId: "2520" },
  // Add more D1 programs here as they appear in programs.ts
];

const HEADFUL = process.argv.includes("--headful");
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadPrevious() {
  if (!existsSync(OUT_FILE)) return { teams: {}, scrapedAt: null };
  try {
    return JSON.parse(readFileSync(OUT_FILE, "utf8"));
  } catch {
    return { teams: {}, scrapedAt: null };
  }
}

/**
 * Extract structured data from a Clippd team page.
 * Clippd is a React SPA; we wait for network idle then parse the DOM.
 */
async function scrapeTeam(page, team) {
  const scheduleUrl = `https://scoreboard.clippd.com/teams/${team.clippdId}/schedule`;
  const teamUrl = `https://scoreboard.clippd.com/teams/${team.clippdId}`;

  console.log(`  → ${team.name} (${team.clippdId})`);

  const result = {
    id: team.id,
    name: team.name,
    clippdId: team.clippdId,
    scheduleUrl,
    teamUrl,
    events: [],
    error: null,
    scrapedAt: new Date().toISOString(),
  };

  try {
    // Prefer schedule page — it lists all recent / current tournaments
    await page.goto(scheduleUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(2500); // let SPA hydrate

    // Capture raw text for defensive parsing
    const bodyText = await page.evaluate(() => document.body?.innerText || "");

    // Try to find tournament cards / rows
    const events = await page.evaluate(() => {
      const found = [];

      // Clippd renders tournament blocks with various class patterns.
      // We look for common structures without relying on fragile class names.
      const candidates = [
        ...document.querySelectorAll("[class*='tournament'], [class*='event'], [class*='schedule']"),
        ...document.querySelectorAll("a[href*='/tournaments/'], a[href*='/events/']"),
        ...document.querySelectorAll("tr, li, article, section"),
      ];

      const seen = new Set();
      for (const el of candidates) {
        const text = (el.innerText || "").trim();
        if (!text || text.length < 10 || text.length > 800) continue;

        // Heuristic: looks like a tournament line if it has a date-ish pattern
        // and a place / score-ish pattern, or a known status word.
        const hasDate =
          /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{1,2}|\d{4})\b/i.test(
            text
          );
        const hasStatus =
          /\b(live|final|complete|upcoming|round\s*\d|thru|T?\d+(st|nd|rd|th)?)\b/i.test(
            text
          );

        if (!hasDate && !hasStatus) continue;

        const key = text.slice(0, 120);
        if (seen.has(key)) continue;
        seen.add(key);

        // Extract a few useful bits
        const placeMatch = text.match(
          /\b(T?\d+(st|nd|rd|th)?)\s*(of\s*\d+)?\b/i
        );
        const scoreMatch = text.match(/\b(\d{3,4})\b/);
        const toParMatch = text.match(/([+-]\d+|E)\b/);

        found.push({
          raw: text.slice(0, 400),
          place: placeMatch ? placeMatch[0] : null,
          score: scoreMatch ? scoreMatch[1] : null,
          toPar: toParMatch ? toParMatch[1] : null,
          href: el.closest("a")?.href || el.querySelector("a")?.href || null,
        });
      }

      // Cap noise
      return found.slice(0, 25);
    });

    result.events = events;
    result.pageTextSnippet = bodyText.slice(0, 1500);

    // If schedule page is empty / blocked, try the main team page
    if (events.length === 0) {
      await page.goto(teamUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await sleep(2500);
      const teamText = await page.evaluate(() => document.body?.innerText || "");
      result.pageTextSnippet = teamText.slice(0, 1500);
      result.note =
        "Schedule page returned few/no structured events; captured team page text for manual review.";
    }
  } catch (err) {
    result.error = String(err?.message || err);
    console.error(`    ✗ ${team.name}: ${result.error}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Clippd scraper starting…");
  console.log(`  headful=${HEADFUL}`);
  console.log(`  teams=${TEAMS.length}`);

  const previous = loadPrevious();
  const browser = await chromium.launch({
    headless: !HEADFUL,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });

  // Reduce fingerprint a bit
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();
  const teams = {};

  for (const team of TEAMS) {
    // Preserve previous successful scrape if this run fails
    const prev = previous.teams?.[team.id] || null;
    const scraped = await scrapeTeam(page, team);

    if (scraped.error && prev && !prev.error) {
      console.log(`    ↺ keeping previous good data for ${team.id}`);
      teams[team.id] = {
        ...prev,
        lastError: scraped.error,
        lastAttemptAt: scraped.scrapedAt,
      };
    } else {
      teams[team.id] = scraped;
    }

    // Be polite — Clippd rate-limits aggressively
    await sleep(3000 + Math.random() * 2000);
  }

  await browser.close();

  const payload = {
    scrapedAt: new Date().toISOString(),
    source: "clippd",
    teams,
    meta: {
      teamCount: TEAMS.length,
      successCount: Object.values(teams).filter((t) => !t.error).length,
      note: "Raw Clippd extract. Merge into programs.ts events manually or via a follow-up transform script. Insights remain human-curated.",
    },
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(
    `  success=${payload.meta.successCount}/${payload.meta.teamCount}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
