#!/usr/bin/env node
/**
 * Clippd college golf scraper (v3)
 * --------------------------------
 * 1. Load each team's schedule page (click Load more)
 * 2. Parse the full calendar (dates, venue, ScoreboardLive)
 * 3. Visit recent / in-progress tournament pages for scores
 * 4. Write public/data/live-results.json
 *
 * Usage:
 *   node scripts/scrape-clippd.mjs
 *   node scripts/scrape-clippd.mjs --headful
 *   node scripts/scrape-clippd.mjs --recent
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
  { id: "man", name: "Manhattan", clippdId: "3652" },
  { id: "rochester", name: "Rochester", clippdId: "2457" },
];

const MAX_TOURNAMENTS_PER_TEAM = 8;
const HEADFUL = process.argv.includes("--headful");
const RECENT_ONLY = process.argv.includes("--recent");
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DATE_LINE =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:\s*[-–]\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{1,2}))?,\s*(\d{4})$/i;
const SKIP_LINE =
  /^(NCAA|NAIA|Men|Women|Division|Conference|Head Coach|Ranking|Roster|Schedule|Season|Home|Tournaments|News|Live Streams|Coach Portal|In Partnership|INFORMATION|National|Load more|ScoreboardLive)$/i;

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

function parseRange(dates) {
  if (!dates) return null;
  const m = String(dates).trim().match(DATE_LINE);
  if (!m) return null;
  const year = Number(m[5]);
  const sm = MONTHS[m[1].slice(0, 3).toLowerCase()];
  const em = MONTHS[(m[3] || m[1]).slice(0, 3).toLowerCase()];
  const start = new Date(year, sm - 1, Number(m[2]));
  const end = new Date(year, em - 1, Number(m[4] || m[2]));
  return { start, end };
}

function parseScheduleSnippet(snippet) {
  if (!snippet) return [];
  const lines = snippet.split("\n").map((l) => l.trim()).filter(Boolean);
  const events = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(DATE_LINE);
    if (!m) {
      i += 1;
      continue;
    }
    const dates = lines[i];
    const name = lines[i + 1] || null;
    const extras = [];
    let scoreboardLive = false;
    let j = i + 2;
    while (j < lines.length && !DATE_LINE.test(lines[j])) {
      const t = lines[j];
      if (t.toLowerCase() === "scoreboardlive") scoreboardLive = true;
      else if (SKIP_LINE.test(t) || /\((Men|Women)\)$/i.test(t)) {
        /* chrome */
      } else extras.push(t);
      j += 1;
    }
    const range = parseRange(dates);
    events.push({
      name,
      dates,
      city: extras[0] || null,
      venue: extras[1] || extras[0] || null,
      scoreboardLive,
      start: range?.start?.toISOString() || null,
      end: range?.end?.toISOString() || null,
      tournamentId: null,
      url: null,
    });
    i = j;
  }
  return events;
}

function nameTokens(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b\d+(st|nd|rd|th)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !["the", "invitational", "invite", "intercollegiate", "classic", "memorial", "championship", "collegiate", "golf", "mens", "men"].includes(t));
}

function namesMatch(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return false;
  const sa = new Set(ta);
  const overlap = tb.filter((t) => sa.has(t)).length;
  const min = Math.min(ta.length, tb.length);
  if (overlap >= min && min >= 1) return true;
  return overlap >= 2;
}

function attachIds(schedule, links) {
  const unused = [...links];
  for (const ev of schedule) {
    const hit = unused.find((l) => l.name && ev.name && namesMatch(ev.name, l.name));
    if (hit) {
      ev.tournamentId = hit.tournamentId;
      ev.url = hit.href;
      unused.splice(unused.indexOf(hit), 1);
    }
  }
  return schedule;
}

function pickToVisit(schedule, links) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 21);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + (RECENT_ONLY ? 14 : 120));

  const withIds = schedule.filter((s) => s.tournamentId);
  const fromLinks = links.filter(
    (l) => !withIds.some((s) => s.tournamentId === l.tournamentId),
  );

  const scored = [
    ...withIds.map((s) => {
      const range = parseRange(s.dates);
      const start = range?.start || new Date(86400000000000);
      const end = range?.end || start;
      const inWindow = end >= windowStart && start <= windowEnd;
      const happening = start <= today && today <= end;
      const past = end < today && end >= windowStart;
      const priority = happening ? 0 : s.scoreboardLive ? 1 : past ? 2 : inWindow ? 3 : 9;
      return { ...s, priority, inWindow, happening };
    }),
    ...fromLinks.map((l) => ({
      name: l.name,
      tournamentId: l.tournamentId,
      url: l.href,
      priority: 8,
      inWindow: false,
    })),
  ].filter((s) => s.tournamentId);

  scored.sort((a, b) => a.priority - b.priority);
  const chosen = [];
  const seen = new Set();
  for (const s of scored) {
    if (seen.has(s.tournamentId)) continue;
    if (RECENT_ONLY && s.priority > 3) continue;
    seen.add(s.tournamentId);
    chosen.push(s);
    if (chosen.length >= MAX_TOURNAMENTS_PER_TEAM) break;
  }
  return chosen;
}

async function extractTournamentsFromSchedule(page) {
  return page.evaluate(() => {
    const byId = new Map();
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
    const body = document.body?.innerText || "";
    return {
      tournaments: [...byId.values()],
      pageTextSnippet: body.slice(0, 8000),
    };
  });
}

async function clickLoadMore(page) {
  for (let i = 0; i < 6; i += 1) {
    const clicked = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("button, a, div, span")];
      const el = nodes.find((n) => /^\s*load more\s*$/i.test(n.textContent || ""));
      if (!el) return false;
      el.click();
      return true;
    });
    if (!clicked) break;
    await sleep(1800);
  }
}

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
        bodySnippet: body.slice(0, 8000),
        teamStandings: [],
        players: [],
        teamRow: null,
        venue: null,
        dates: null,
      };

      const venueMatch = body.match(/Venue:\s*\n([^\n]+)/i);
      const dateMatch = body.match(/Dates?:\s*\n([^\n]+)/i);
      if (venueMatch) out.venue = venueMatch[1].trim();
      if (dateMatch) out.dates = dateMatch[1].trim();

      const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        const teamMatch = line.match(
          /^(T?\d+)\s+(.+?)\s+((?:\d{2,3}\s+){1,4}\d{3,4})\s*([+-]?\d+|E)?\s*$/i,
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

      if (focusTeam) {
        const focus = focusTeam.toLowerCase();
        out.teamRow =
          out.teamStandings.find(
            (r) =>
              r.team.toLowerCase().includes(focus) ||
              focus.includes(r.team.toLowerCase().split(" ")[0]),
          ) || null;
      }

      const playerRe =
        /^([A-Za-z][A-Za-z.'\- ]+?)\s+((?:\d{2,3}\s+){1,4}\d{2,3})\s*([+-]?\d+|E)?\s*(T?\d+|WD|DQ|CUT)?\s*(IND)?\s*$/;

      for (const line of lines) {
        const pm = line.match(playerRe);
        if (!pm) continue;
        const name = pm[1].trim();
        if (name.length < 4 || name.length > 40) continue;
        if (/^(round|total|par|team|pos|thru|score)/i.test(name)) continue;
        const nums = pm[2].trim().split(/\s+/).map((n) => parseInt(n, 10));
        const total = nums[nums.length - 1];
        const rounds = nums.slice(0, -1);
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
    result.venue = data.venue || null;
    result.dates = data.dates || null;
    result.teamStandings = data.teamStandings.slice(0, 30);
    result.players = data.players.slice(0, 40);

    if (data.teamRow) {
      result.teamPlace = data.teamRow.place;
      result.teamRounds = data.teamRow.rounds;
      result.teamTotal = data.teamRow.total;
      result.teamToPar = data.teamRow.toPar;
    }

    const snip = (data.bodySnippet || "").toLowerCase();
    const noPlayers = /no players to show yet/.test(snip);
    if (/\blive\b|in progress|thru\s*\d/.test(snip) && !noPlayers) result.status = "live";
    else if (/final|complete|completed/.test(snip) || result.players.length) result.status = "complete";
    else result.status = noPlayers ? "upcoming" : "unknown";

    if (!result.dates) {
      const dateMatch = (data.bodySnippet || "").match(
        /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\n]{0,40}\d{4})/i,
      );
      if (dateMatch) result.dates = dateMatch[1].trim();
    }
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
    schedule: [],
    error: null,
    scrapedAt: new Date().toISOString(),
  };

  try {
    await page.goto(scheduleUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(2500);
    await clickLoadMore(page);

    const { tournaments, pageTextSnippet } = await extractTournamentsFromSchedule(page);
    result.scheduleSnippet = pageTextSnippet?.slice(0, 6000) || null;
    const schedule = attachIds(parseScheduleSnippet(pageTextSnippet), tournaments);
    result.schedule = schedule;

    const filtered = tournaments.filter((t) => {
      const n = (t.name || "").toLowerCase();
      if (!n) return true;
      if (n.includes("live stream")) return false;
      if (n === "season" || n.startsWith("season ")) return false;
      return true;
    });

    const toVisit = pickToVisit(schedule, filtered);
    console.log(
      `  schedule=${schedule.length} links=${tournaments.length} visiting=${toVisit.length}`,
    );

    for (const t of toVisit) {
      console.log(`    · ${t.tournamentId} ${t.name || ""}`);
      const detail = await scrapeTournament(page, t.tournamentId, team.name);
      if (!detail.name && t.name) detail.name = t.name;
      if (!detail.dates && t.dates) detail.dates = t.dates;
      if (!detail.venue && t.venue) detail.venue = t.venue;
      result.tournaments.push(detail);
      await sleep(2000 + Math.random() * 1500);
    }
  } catch (err) {
    result.error = String(err?.message || err);
    console.error(`  ✗ ${team.name}: ${result.error}`);
  }

  return result;
}

function keepBetter(prev, scraped) {
  if (!prev) return scraped;
  const prevById = new Map((prev.tournaments || []).map((t) => [t.tournamentId, t]));
  const merged = (scraped.tournaments || []).map((t) => {
    const old = prevById.get(t.tournamentId);
    const newHas = (t.players && t.players.length) || t.teamPlace || t.teamTotal;
    const oldHas = old && ((old.players && old.players.length) || old.teamPlace || old.teamTotal);
    if (!newHas && oldHas) return { ...old, lastEmptyAt: scraped.scrapedAt };
    return t;
  });
  return {
    ...scraped,
    tournaments: merged,
    schedule: scraped.schedule?.length ? scraped.schedule : prev.schedule,
    scheduleSnippet: scraped.scheduleSnippet || prev.scheduleSnippet,
  };
}

async function main() {
  console.log("Clippd scraper v3 starting…");
  console.log(`  headful=${HEADFUL} recent=${RECENT_ONLY} teams=${TEAMS.length}`);

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
      teams[team.id] = keepBetter(prev, scraped);
    }

    await sleep(2500 + Math.random() * 1500);
  }

  await browser.close();

  const allTournaments = Object.values(teams).flatMap((t) => t.tournaments || []);
  const withScores = allTournaments.filter(
    (t) => t.teamPlace || (t.players && t.players.length > 0),
  );

  const payload = {
    scrapedAt: new Date().toISOString(),
    source: "clippd",
    version: 3,
    teams,
    meta: {
      teamCount: TEAMS.length,
      successCount: Object.values(teams).filter((t) => !t.error).length,
      tournamentPagesVisited: allTournaments.length,
      tournamentsWithScores: withScores.length,
      note: "v3 parses the full Clippd calendar and visits recent/live boards first. Scores are never invented.",
    },
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(
    `  teams ok=${payload.meta.successCount}/${payload.meta.teamCount}  tournaments=${payload.meta.tournamentPagesVisited}  withScores=${payload.meta.tournamentsWithScores}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
