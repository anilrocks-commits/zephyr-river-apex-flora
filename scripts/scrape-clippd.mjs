#!/usr/bin/env node
/**
 * Clippd college golf scraper (v4)
 * --------------------------------
 * 1. Load each team's schedule page (click Load more)
 * 2. Parse the full calendar (dates, venue, ScoreboardLive)
 * 3. Visit /scoring/team + /scoring/player for recent/live events
 * 4. Write public/data/live-results.json
 *
 * Clippd layout note: the tournament hub (/tournaments/{id}) is a participant
 * list. Actual leaderboards are on:
 *   /tournaments/{id}/scoring/team
 *   /tournaments/{id}/scoring/player
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
    .filter(
      (t) =>
        t.length > 1 &&
        !["the", "invitational", "invite", "intercollegiate", "classic", "memorial", "championship", "collegiate", "golf", "mens", "men"].includes(t),
    );
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

function teamNameMatch(rowTeam, focusTeam) {
  const a = String(rowTeam || "").toLowerCase();
  const b = String(focusTeam || "").toLowerCase();
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  const sa = new Set(ta);
  const overlap = tb.filter((t) => sa.has(t)).length;
  return overlap >= Math.min(2, tb.length);
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
  windowStart.setDate(windowStart.getDate() - 45);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + (RECENT_ONLY ? 21 : 90));

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
      const farFuture = start > windowEnd;
      const priority = happening
        ? 0
        : s.scoreboardLive
          ? 1
          : past
            ? 2
            : inWindow
              ? 3
              : farFuture
                ? 9
                : 8;
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
    // Skip far-future spring championships when we already have enough near-term cards
    if (s.priority >= 9 && chosen.length >= 3) continue;
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

/** Parse team leaderboard text from /scoring/team */
function parseTeamBoard(body, focusTeam) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const teamStandings = [];

  // Multi-line Clippd layout often: place / team name / R1 R2 total / toPar
  // Also single-line: "T1 Team Name 288 290 578 +10"
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const single = line.match(
      /^(T?\d+)\s+(.+?)\s+((?:\d{2,3}\s+){1,4}\d{3,4})\s*([+-]?\d+|E)?\s*$/i,
    );
    if (single) {
      const rounds = single[3].trim().split(/\s+/).map((n) => parseInt(n, 10));
      const total = rounds[rounds.length - 1];
      const roundScores = rounds.slice(0, -1);
      teamStandings.push({
        place: single[1],
        team: single[2].trim(),
        rounds: roundScores,
        total,
        toPar: single[4] || null,
      });
      continue;
    }

    // Split: place on one line, team next, scores next
    const placeOnly = line.match(/^(T?\d+)$/);
    if (placeOnly && lines[i + 1] && lines[i + 2]) {
      const team = lines[i + 1];
      const scoreLine = lines[i + 2];
      const scores = scoreLine.match(/^((?:\d{2,3}\s+){1,4}\d{3,4})\s*([+-]?\d+|E)?$/i);
      if (scores && !/^(round|total|pos|#)/i.test(team) && team.length > 2) {
        const rounds = scores[1].trim().split(/\s+/).map((n) => parseInt(n, 10));
        const total = rounds[rounds.length - 1];
        teamStandings.push({
          place: placeOnly[1],
          team: team.trim(),
          rounds: rounds.slice(0, -1),
          total,
          toPar: scores[2] || null,
        });
        i += 2;
      }
    }
  }

  const teamRow =
    teamStandings.find((r) => teamNameMatch(r.team, focusTeam)) || null;

  return { teamStandings, teamRow };
}

/** Parse player leaderboard text from /scoring/player */
function parsePlayerBoard(body, focusTeam) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const players = [];

  // Single-line style
  const playerRe =
    /^([A-Za-z][A-Za-z.'\- ]+?)\s+((?:\d{2,3}\s+){1,4}\d{2,3})\s*([+-]?\d+|E)?\s*(T?\d+|WD|DQ|CUT)?\s*(IND)?\s*$/;

  for (const line of lines) {
    const pm = line.match(playerRe);
    if (!pm) continue;
    const name = pm[1].trim();
    if (name.length < 4 || name.length > 40) continue;
    if (/^(round|total|par|team|pos|thru|score|player)/i.test(name)) continue;
    const nums = pm[2].trim().split(/\s+/).map((n) => parseInt(n, 10));
    const total = nums[nums.length - 1];
    if (total > 320) continue;
    players.push({
      name,
      rounds: nums.slice(0, -1),
      total,
      toPar: pm[3] || null,
      finish: pm[4] || null,
      role: pm[5] ? "ind" : "team",
      team: null,
    });
  }

  // Table-ish multi-line: place, toPar, team, player, total, thru, RD1...
  // Capture pairs of team-name / player-name when focus team matches
  for (let i = 0; i < lines.length - 2; i += 1) {
    const maybeTeam = lines[i];
    const maybePlayer = lines[i + 1];
    const maybeScores = lines[i + 2];
    if (!teamNameMatch(maybeTeam, focusTeam) && focusTeam) {
      // still collect if it looks like Name + scores without team prefix
      continue;
    }
    if (!/^[A-Za-z]/.test(maybePlayer)) continue;
    if (maybePlayer.length < 4 || maybePlayer.length > 40) continue;
    // Scores as "72 71 143" or to-par column nearby
    const scoreMatch = maybeScores.match(/^((?:\d{2,3}\s+){0,3}\d{2,3})\s*([+-]?\d+|E)?$/);
    if (!scoreMatch) continue;
    const nums = scoreMatch[1].trim().split(/\s+/).map((n) => parseInt(n, 10));
    if (nums.some((n) => !Number.isFinite(n))) continue;
    const total = nums[nums.length - 1];
    if (total > 320 || total < 50) continue;
    players.push({
      name: maybePlayer,
      rounds: nums.length > 1 ? nums.slice(0, -1) : nums,
      total,
      toPar: scoreMatch[2] || null,
      finish: null,
      role: "team",
      team: maybeTeam,
    });
  }

  // Prefer players tagged to our team when focus is set; otherwise keep all
  let filtered = players;
  if (focusTeam) {
    const ours = players.filter(
      (p) => !p.team || teamNameMatch(p.team, focusTeam),
    );
    if (ours.length >= 3) filtered = ours;
  }

  const seen = new Set();
  return filtered.filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function readPageText(page) {
  return page.evaluate(() => {
    const body = document.body?.innerText || "";
    return {
      title: document.title || null,
      h1: document.querySelector("h1")?.innerText?.trim() || null,
      body,
      bodySnippet: body.slice(0, 10000),
    };
  });
}

function extractMeta(body) {
  const venue =
    body.match(/Venue:\s*\n?\s*([^\n]+)/i)?.[1]?.trim() ||
    body.match(/Venue:\s*([^\n]+)/i)?.[1]?.trim() ||
    null;
  const dates =
    body.match(/Dates?:\s*\n?\s*([^\n]+)/i)?.[1]?.trim() ||
    body.match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*(?:[A-Za-z]+\.?\s+)?\d{1,2})?,\s*\d{4})/i,
    )?.[1]?.trim() ||
    null;
  return { venue, dates };
}

async function scrapeTournament(page, tournamentId, teamName) {
  const hubUrl = `https://scoreboard.clippd.com/tournaments/${tournamentId}`;
  const teamUrl = `${hubUrl}/scoring/team`;
  const playerUrl = `${hubUrl}/scoring/player`;

  const result = {
    tournamentId,
    url: teamUrl,
    hubUrl,
    playerUrl,
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
    // 1) Team leaderboard
    await page.goto(teamUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(2500);
    const teamPage = await readPageText(page);
    const meta = extractMeta(teamPage.body);
    result.name = teamPage.h1 || teamPage.title || null;
    result.venue = meta.venue;
    result.dates = meta.dates;
    result.rawSnippet = teamPage.bodySnippet;

    const { teamStandings, teamRow } = parseTeamBoard(teamPage.body, teamName);
    result.teamStandings = teamStandings.slice(0, 40);
    if (teamRow) {
      result.teamPlace = teamRow.place;
      result.teamRounds = teamRow.rounds;
      result.teamTotal = teamRow.total;
      result.teamToPar = teamRow.toPar;
    }

    // 2) Player leaderboard
    await page.goto(playerUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(2500);
    const playerPage = await readPageText(page);
    if (!result.name) result.name = playerPage.h1 || playerPage.title || null;
    if (!result.dates || !result.venue) {
      const m2 = extractMeta(playerPage.body);
      result.dates = result.dates || m2.dates;
      result.venue = result.venue || m2.venue;
    }
    result.rawSnippet = `${result.rawSnippet || ""}\n---PLAYER---\n${playerPage.bodySnippet}`.slice(
      0,
      14000,
    );

    result.players = parsePlayerBoard(playerPage.body, teamName).slice(0, 50);

    // Fallback: if team board empty, try hub once (some events only populate hub)
    if (!result.teamStandings.length && !result.players.length) {
      await page.goto(hubUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await sleep(2000);
      const hub = await readPageText(page);
      const hubTeams = parseTeamBoard(hub.body, teamName);
      if (hubTeams.teamStandings.length) {
        result.teamStandings = hubTeams.teamStandings.slice(0, 40);
        if (hubTeams.teamRow) {
          result.teamPlace = hubTeams.teamRow.place;
          result.teamRounds = hubTeams.teamRow.rounds;
          result.teamTotal = hubTeams.teamRow.total;
          result.teamToPar = hubTeams.teamRow.toPar;
        }
      }
      if (!result.players.length) {
        result.players = parsePlayerBoard(hub.body, teamName).slice(0, 50);
      }
      result.rawSnippet = hub.bodySnippet;
    }

    const snip = (result.rawSnippet || "").toLowerCase();
    const noPlayers = /no players to show yet/.test(snip);
    const hasScores =
      result.players.length > 0 ||
      result.teamPlace ||
      result.teamTotal != null ||
      result.teamStandings.length > 0;

    if (hasScores && (/\blive\b|in progress|thru\s*\d/.test(snip) || /scoreboardlive/.test(snip))) {
      result.status = "live";
    } else if (hasScores) {
      result.status = "complete";
    } else if (noPlayers) {
      result.status = "upcoming";
    } else {
      result.status = "unknown";
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
      const scored =
        detail.teamPlace ||
        detail.teamTotal != null ||
        (detail.players && detail.players.length);
      console.log(
        `      status=${detail.status} team=${detail.teamPlace || "—"} players=${(detail.players || []).length}${scored ? " ✓" : ""}`,
      );
      await sleep(1500 + Math.random() * 1200);
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
  // Keep previous tournament pages not re-visited this run
  for (const [id, old] of prevById) {
    if (!merged.some((t) => t.tournamentId === id)) {
      const oldHas = (old.players && old.players.length) || old.teamPlace || old.teamTotal;
      if (oldHas) merged.push(old);
    }
  }
  return {
    ...scraped,
    tournaments: merged,
    schedule: scraped.schedule?.length ? scraped.schedule : prev.schedule,
    scheduleSnippet: scraped.scheduleSnippet || prev.scheduleSnippet,
  };
}

async function main() {
  console.log("Clippd scraper v4 starting…");
  console.log(`  headful=${HEADFUL} recent=${RECENT_ONLY} teams=${TEAMS.length}`);
  console.log("  boards: /scoring/team + /scoring/player");

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

    await sleep(2000 + Math.random() * 1500);
  }

  await browser.close();

  const allTournaments = Object.values(teams).flatMap((t) => t.tournaments || []);
  const withScores = allTournaments.filter(
    (t) => t.teamPlace || (t.players && t.players.length > 0),
  );

  const payload = {
    scrapedAt: new Date().toISOString(),
    source: "clippd",
    version: 4,
    teams,
    meta: {
      teamCount: TEAMS.length,
      successCount: Object.values(teams).filter((t) => !t.error).length,
      tournamentPagesVisited: allTournaments.length,
      tournamentsWithScores: withScores.length,
      note: "v4 reads /scoring/team and /scoring/player. Hub pages alone never have scores. Scores are never invented.",
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
