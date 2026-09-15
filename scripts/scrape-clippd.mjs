#!/usr/bin/env node
/**
 * Clippd college golf scraper (v2)
 * --------------------------------
 * 1. Load each team's schedule page
 * 2. Extract tournament IDs from links
 * 3. Visit each tournament page and pull team/player results
 * 4. Write public/data/live-results.json
 *
 * Usage:
 *   node scripts/scrape-clippd.mjs
 *   node scripts/scrape-clippd.mjs --headful
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data");
const OUT_FILE = join(OUT_DIR, "live-results.json");

const TEAMS = [
  { id: "siu", name: "Southern Illinois", clippdId: "4127" },
  { id: "ksu", name: "Kennesaw State", clippdId: "4172" },
  { id: "shu", name: "Seton Hall", clippdId: "3163" },
  { id: "ucsb", name: "UC Santa Barbara", clippdId: "2520" },
];

// Cap tournament depth so daily runs stay under Actions timeout
const MAX_TOURNAMENTS_PER_TEAM = 8;
const HEADFUL = process.argv.includes("--headful");
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

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
 * From a schedule page, collect tournament IDs + basic metadata.
 */
async function extractTournamentsFromSchedule(page) {
  return page.evaluate(() => {
    const byId = new Map();

    // All links that point at /tournaments/{id}
    for (const a of document.querySelectorAll('a[href*="/tournaments/"]')) {
      const m = (a.href || "").match(/\/tournaments\/(\d+)/);
      if (!m) continue;
      const id = m[1];
      const text = (a.innerText || a.textContent || "").trim();
      if (!byId.has(id)) {
        byId.set(id, {
          tournamentId: id,
          name: text || null,
          href: `https://scoreboard.clippd.com/tournaments/${id}`,
        });
      } else if (text && text.length > (byId.get(id).name || "").length) {
        byId.get(id).name = text;
      }
    }

    // Fallback: parse body text for "Name\\nDates" style blocks near known IDs
    const body = document.body?.innerText || "";
    return {
      tournaments: [...byId.values()],
      pageTextSnippet: body.slice(0, 4000),
    };
  });
}

/**
 * Visit a tournament page and extract team + player leaderboard data.
 * Clippd markup varies; we use several heuristics and keep raw text as backup.
 */
async function scrapeTournament(page, tournamentId, teamName) {
  const url = `https://scoreboard.clippd.com/tournaments/${tournamentId}`;
  const result = {
    tournamentId,
    url,
    name: null,
    dates: null,
    venue: null,
    status: null,
    teamPlace: null,
    teamTotal: null,
    teamToPar: null,
    teamRounds: [],
    players: [],
    teamStandings: [],
    error: null,
    rawSnippet: null,
  };

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(2800);

    const data = await page.evaluate((focusTeam) => {
      const body = document.body?.innerText || "";
      const out = {
        title: document.title || null,
        h1: document.querySelector("h1")?.innerText?.trim() || null,
        bodySnippet: body.slice(0, 5000),
        teamStandings: [],
        players: [],
        teamRow: null,
      };

      // --- Team standings table heuristic ---
      // Look for rows that contain a school name + scores like 278 286 289 853 -11
      const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // e.g. "1 SETON HALL 278 286 289 853 -11" or "T6 Kennesaw State 282 289 ..."
        const teamMatch = line.match(
          /^(T?\d+)\s+(.+?)\s+((?:\d{2,3}\s+){1,4}\d{3,4})\s*([+-]?\d+|E)?\s*$/i
        );
        if (teamMatch) {
          const rounds = teamMatch[3].trim().split(/\s+/).map((n) => parseInt(n, 10));
          const total = rounds[rounds.length - 1];
          const roundScores = rounds.slice(0, -1);
          out.teamStandings.push({
            place: teamMatch[1],
            team: teamMatch[2].trim(),
            rounds: roundScores,
            total,
            toPar: teamMatch[4] || null,
          });
        }
      }

      // Find our team's row
      if (focusTeam) {
        const focus = focusTeam.toLowerCase();
        out.teamRow =
          out.teamStandings.find(
            (r) =>
              r.team.toLowerCase().includes(focus) ||
              focus.includes(r.team.toLowerCase().split(" ")[0])
          ) || null;
      }

      // --- Individual scores near team name ---
      // Pattern: PlayerName 70 71 70 211 -5 T2  (or with IND marker)
      const playerRe =
        /^([A-Za-z][A-Za-z.'\- ]+?)\s+((?:\d{2,3}\s+){1,4}\d{2,3})\s*([+-]?\d+|E)?\s*(T?\d+|WD|DQ|CUT)?\s*(IND)?\s*$/;

      for (const line of lines) {
        const pm = line.match(playerRe);
        if (!pm) continue;
        const name = pm[1].trim();
        // Skip obvious non-player noise
        if (name.length < 4 || name.length > 40) continue;
        if (/^(round|total|par|team|pos|thru|score)/i.test(name)) continue;

        const nums = pm[2].trim().split(/\s+/).map((n) => parseInt(n, 10));
        const total = nums[nums.length - 1];
        const rounds = nums.slice(0, -1);
        // Individual totals are usually 200-250 for 54 holes; team totals are 800+
        if (total > 320) continue;

        out.players.push({
          name,
          rounds,
          total,
          toPar: pm[3] || null,
          finish: pm[4] || null,
          role: pm[5] ? "ind" : "team",
        });
      }

      // Dedupe players by name
      const seen = new Set();
      out.players = out.players.filter((p) => {
        const k = p.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      return out;
    }, teamName);

    result.name = data.h1 || data.title || null;
    result.rawSnippet = data.bodySnippet;
    result.teamStandings = data.teamStandings.slice(0, 30);
    result.players = data.players.slice(0, 40);

    if (data.teamRow) {
      result.teamPlace = data.teamRow.place;
      result.teamRounds = data.teamRow.rounds;
      result.teamTotal = data.teamRow.total;
      result.teamToPar = data.teamRow.toPar;
    }

    // Status heuristic from page text
    const snip = (data.bodySnippet || "").toLowerCase();
    if (/\blive\b|in progress|thru\s*\d/.test(snip)) result.status = "live";
    else if (/final|complete|completed/.test(snip)) result.status = "complete";
    else result.status = "unknown";

    // Try to pull dates from first lines
    const dateMatch = (data.bodySnippet || "").match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\n]{0,40}\d{4})/i
    );
    if (dateMatch) result.dates = dateMatch[1].trim();
  } catch (err) {
    result.error = String(err?.message || err);
  }

  return result;
}

async function scrapeTeam(page, team) {
  const scheduleUrl = `https://scoreboard.clippd.com/teams/${team.clippdId}/schedule`;
  console.log(`\n→ ${team.name} (${team.clippdId})`);

  const result = {
    id: team.id,
    name: team.name,
    clippdId: team.clippdId,
    scheduleUrl,
    teamUrl: `https://scoreboard.clippd.com/teams/${team.clippdId}`,
    tournaments: [],
    error: null,
    scrapedAt: new Date().toISOString(),
  };

  try {
    await page.goto(scheduleUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(2500);

    const { tournaments, pageTextSnippet } = await extractTournamentsFromSchedule(page);
    result.scheduleSnippet = pageTextSnippet?.slice(0, 2000) || null;

    // Prefer tournaments that look current (have a real name, not nav junk)
    const filtered = tournaments.filter((t) => {
      const n = (t.name || "").toLowerCase();
      if (!n) return true;
      if (n.includes("live stream")) return false;
      if (n === "season" || n.startsWith("season ")) return false;
      return true;
    });

    const toVisit = filtered.slice(0, MAX_TOURNAMENTS_PER_TEAM);
    console.log(`  found ${tournaments.length} tournament link(s), visiting ${toVisit.length}`);

    for (const t of toVisit) {
      console.log(`    · tournament ${t.tournamentId} ${t.name || ""}`);
      const detail = await scrapeTournament(page, t.tournamentId, team.name);
      if (!detail.name && t.name) detail.name = t.name;
      result.tournaments.push(detail);
      await sleep(2000 + Math.random() * 1500);
    }
  } catch (err) {
    result.error = String(err?.message || err);
    console.error(`  ✗ ${team.name}: ${result.error}`);
  }

  return result;
}

async function main() {
  console.log("Clippd scraper v2 starting…");
  console.log(`  headful=${HEADFUL}  teams=${TEAMS.length}`);

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

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();
  const teams = {};

  for (const team of TEAMS) {
    const prev = previous.teams?.[team.id] || null;
    const scraped = await scrapeTeam(page, team);

    if (scraped.error && prev && !prev.error) {
      console.log(`  ↺ keeping previous good data for ${team.id}`);
      teams[team.id] = {
        ...prev,
        lastError: scraped.error,
        lastAttemptAt: scraped.scrapedAt,
      };
    } else {
      teams[team.id] = scraped;
    }

    await sleep(2500 + Math.random() * 1500);
  }

  await browser.close();

  const allTournaments = Object.values(teams).flatMap(
    (t) => t.tournaments || []
  );
  const withScores = allTournaments.filter(
    (t) => t.teamPlace || (t.players && t.players.length > 0)
  );

  const payload = {
    scrapedAt: new Date().toISOString(),
    source: "clippd",
    version: 2,
    teams,
    meta: {
      teamCount: TEAMS.length,
      successCount: Object.values(teams).filter((t) => !t.error).length,
      tournamentPagesVisited: allTournaments.length,
      tournamentsWithScores: withScores.length,
      note: "v2 follows /tournaments/{id} pages. teamPlace/players filled when leaderboard text matches heuristics.",
    },
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(
    `  teams ok=${payload.meta.successCount}/${payload.meta.teamCount}  tournaments=${payload.meta.tournamentPagesVisited}  withScores=${payload.meta.tournamentsWithScores}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
