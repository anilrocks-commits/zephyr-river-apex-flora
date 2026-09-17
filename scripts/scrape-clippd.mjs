#!/usr/bin/env node
/**
 * Clippd college golf scraper (v5.2)
 * --------------------------------
 * Scores via HTTP + Chrome UA on:
 *   /tournaments/{id}/scoring/team?displayMode=stroke
 *   /tournaments/{id}/scoring/player?displayMode=stroke
 *
 * Usage:
 *   node scripts/scrape-clippd.mjs
 *   node scripts/scrape-clippd.mjs --recent
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

async function httpGet(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
  });
  const text = await res.text();
  return { status: res.status, text, ok: res.ok };
}

function htmlToLines(html) {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, "\n");
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function htmlToFlat(html) {
  return htmlToLines(html).join(" ");
}

function stripHoleNoise(flat) {
  return flat
    .replace(/Round\s*\d+\s*Total\s*Current\s*Round[\s\d]+IN\s*RD\s*No data available/gi, " | ")
    .replace(/No data available/gi, " ")
    .replace(/\b(?:OUT|IN|RD)\b/g, " ");
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
    if (s.priority >= 9 && chosen.length >= 3) continue;
    seen.add(s.tournamentId);
    chosen.push(s);
    if (chosen.length >= MAX_TOURNAMENTS_PER_TEAM) break;
  }
  return chosen;
}

function extractMeta(htmlOrText) {
  const body = htmlOrText || "";
  const titleTag = body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "";
  let title = null;
  const fromTitle = titleTag.match(
    /SCOREBOARD\s*[-–]\s*(.+?)\s*(?:\(\s*(?:Men|Women)\s*\))?\s*(?:Team|Player)\s*Leaderboard/i,
  );
  if (fromTitle) title = fromTitle[1].trim();
  if (!title) {
    const flat = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const m = flat.match(
      /SCOREBOARD\s*[-–]\s*(.+?)\s*(?:\(\s*(?:Men|Women)\s*\))?\s*(?:Team|Player)\s*Leaderboard/i,
    );
    if (m) title = m[1].trim();
  }
  if (title && /^SCOREBOARD$/i.test(title)) title = null;

  const flat = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const venue =
    flat.match(/Venue\s*:\s*([^|]+?)(?:\s+Hosted|\s+Division|\s+Scoring|$)/i)?.[1]?.trim() ||
    body.match(/Venue:\s*\n?\s*([^\n<]+)/i)?.[1]?.trim() ||
    null;
  const dates =
    flat.match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*(?:[A-Za-z]+\.?\s+)?\d{1,2})?,?\s*\d{4})/i,
    )?.[1]?.trim() || null;
  return { venue, dates, title };
}

function parseTeamStrokeBoard(html, focusTeam) {
  const flat = stripHoleNoise(htmlToFlat(html));
  const teamStandings = [];
  const seen = new Set();

  // place + optional movement + Team Name + total + F + r1 r2 r3
  // e.g. "3 5 Seton Hall 846 F 283 286 277"
  const pat =
    /(?<![\d])(T?\d{1,2})\s+(?:(\d{1,2})\s+)?([A-Z](?:[A-Za-z0-9.&'()\/-]| (?=[A-Za-z(])){1,40}?)\s+(\d{3,4})\s+F\s+(\d{2,3})\s+(\d{2,3})\s+(\d{2,3})(?:\s+(\d{2,3}))?(?!\d)/g;

  let m;
  while ((m = pat.exec(flat)) !== null) {
    const team = m[3].trim();
    if (
      /^(round|total|current|data|available|thru|view|host|division|scoring|pts|leaderboard)/i.test(
        team,
      )
    )
      continue;
    if (/\d{3}/.test(team)) continue;
    if (team.length < 2 || team.length > 42) continue;
    const key = team.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const rounds = [m[5], m[6], m[7], m[8]]
      .filter(Boolean)
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n) && n >= 50 && n <= 400)
      .slice(0, 4);

    teamStandings.push({
      place: m[1],
      team,
      total: parseInt(m[4], 10),
      rounds,
      toPar: null,
      movement: m[2] || null,
    });
  }

  if (!teamStandings.length) {
    const parPat =
      /(T?\d{1,2})\s+-\s+([A-Za-z][A-Za-z0-9 .&'()\/-]+?)\s+([+-]?\d+|E)\s+F\s+([+-]?\d+|E)\s+([+-]?\d+|E)\s+([+-]?\d+|E)/gi;
    while ((m = parPat.exec(flat)) !== null) {
      const team = m[2].trim();
      if (/round|current|data/i.test(team)) continue;
      const key = team.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      teamStandings.push({
        place: m[1],
        team,
        total: null,
        rounds: [m[4], m[5], m[6]],
        toPar: m[3],
        movement: null,
      });
    }
  }

  const teamRow =
    teamStandings.find((r) => teamNameMatch(r.team, focusTeam)) || null;
  return { teamStandings, teamRow };
}

function parsePlayerStrokeBoard(html, focusTeam) {
  const lines = htmlToLines(html);
  const nameRe = /^[A-Z][a-zA-Z.'\-]+(?:\s+[A-Z][a-zA-Z.'\-]+)+$/;
  const players = [];
  let i = 0;
  while (i < lines.length - 4) {
    if (nameRe.test(lines[i]) && teamNameMatch(lines[i + 1], focusTeam)) {
      const name = lines[i];
      const teamLabel = lines[i + 1];
      let place = null;
      for (const back of [2, 1, 3]) {
        if (i >= back && /^T?\d{1,3}$/.test(lines[i - back])) {
          place = lines[i - back];
          break;
        }
      }
      const nums = [];
      let j = i + 2;
      while (j < lines.length && j < i + 12) {
        const t = lines[j];
        if (t === "F" || t === "-" || t === "E" || /^[+-]?\d+$/.test(t)) {
          nums.push(t);
          j += 1;
        } else break;
      }

      const strokes = [];
      for (const x of nums) {
        if (/^\d{2,3}$/.test(x)) strokes.push(parseInt(x, 10));
      }

      let total = null;
      let rounds = [];
      if (strokes.length && strokes[0] >= 150) {
        total = strokes[0];
        rounds = strokes
          .slice(1)
          .filter((n) => n >= 50 && n <= 120)
          .slice(0, 4);
      } else if (strokes.length) {
        rounds = strokes.filter((n) => n >= 50 && n <= 120).slice(0, 4);
        if (rounds.length) total = rounds.reduce((a, b) => a + b, 0);
      }

      const role = /\(IND\)/i.test(teamLabel) ? "ind" : "team";
      players.push({
        name,
        team: teamLabel,
        role,
        finish: place,
        total,
        rounds,
        toPar: null,
      });
      i = j;
      continue;
    }
    i += 1;
  }

  const seen = new Set();
  return players.filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function linksFromHtml(html) {
  const byId = new Map();
  const re = /href=["']([^"']*\/tournaments\/(\d+)[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[2];
    if (!byId.has(id)) {
      byId.set(id, {
        tournamentId: id,
        name: null,
        href: `https://scoreboard.clippd.com/tournaments/${id}`,
      });
    }
  }
  return [...byId.values()];
}

async function scrapeTournamentHttp(tournamentId, teamName) {
  const hubUrl = `https://scoreboard.clippd.com/tournaments/${tournamentId}`;
  const teamUrl = `${hubUrl}/scoring/team?displayMode=stroke`;
  const playerUrl = `${hubUrl}/scoring/player?displayMode=stroke`;

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
    fetchMode: "http-stroke",
  };

  try {
    const teamRes = await httpGet(teamUrl);
    if (!teamRes.ok) {
      result.error = `team board HTTP ${teamRes.status}`;
      return result;
    }
    const meta = extractMeta(teamRes.text);
    result.name = meta.title;
    result.venue = meta.venue;
    result.dates = meta.dates;
    result.rawSnippet = stripHoleNoise(htmlToFlat(teamRes.text)).slice(0, 4000);

    const { teamStandings, teamRow } = parseTeamStrokeBoard(
      teamRes.text,
      teamName,
    );
    result.teamStandings = teamStandings.slice(0, 40);
    if (teamRow) {
      result.teamPlace = teamRow.place;
      result.teamRounds = teamRow.rounds;
      result.teamTotal = teamRow.total;
      result.teamToPar = teamRow.toPar;
    }

    await sleep(400 + Math.random() * 400);

    const playerRes = await httpGet(playerUrl);
    if (playerRes.ok) {
      const m2 = extractMeta(playerRes.text);
      if (!result.name) result.name = m2.title;
      if (!result.dates) result.dates = m2.dates;
      if (!result.venue) result.venue = m2.venue;
      result.players = parsePlayerStrokeBoard(playerRes.text, teamName).slice(0, 40);
      result.rawSnippet = `${result.rawSnippet || ""}\n---PLAYER---\n${stripHoleNoise(htmlToFlat(playerRes.text)).slice(0, 4000)}`.slice(0, 12000);
    }

    try {
      const api = await httpGet(
        `https://scoreboard.clippd.com/api/tournaments/${tournamentId}`,
      );
      if (api.ok) {
        const data = JSON.parse(api.text);
        if (!result.name || /^SCOREBOARD$/i.test(result.name)) {
          result.name = data.tournamentName || result.name;
        }
        result.venue = result.venue || data.venue || null;
        if (data.startDate && data.endDate) {
          const fmt = (iso) => {
            const d = new Date(iso + "T12:00:00Z");
            return d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            });
          };
          result.dates =
            result.dates ||
            (data.startDate === data.endDate
              ? fmt(data.startDate)
              : `${fmt(data.startDate)} - ${fmt(data.endDate)}`);
        }
        if (data.isComplete && (result.players.length || result.teamTotal != null)) {
          result.status = "complete";
        } else if (data.hasResults && !data.isComplete) {
          result.status = "live";
        }
      }
    } catch {
      /* optional */
    }

    const hasScores =
      result.players.length > 0 ||
      result.teamPlace ||
      result.teamTotal != null ||
      result.teamStandings.length > 0;
    if (!result.status) {
      if (hasScores) result.status = "complete";
      else if (/no players to show yet/i.test(result.rawSnippet || ""))
        result.status = "upcoming";
      else result.status = "unknown";
    }
  } catch (err) {
    result.error = String(err?.message || err);
  }

  return result;
}

async function scrapeScheduleHttp(team) {
  const scheduleUrl = `https://scoreboard.clippd.com/teams/${team.clippdId}/schedule`;
  const res = await httpGet(scheduleUrl);
  if (!res.ok) return { ok: false, scheduleUrl, error: `HTTP ${res.status}` };
  const links = linksFromHtml(res.text);
  const lines = htmlToLines(res.text).join("\n");
  const schedule = attachIds(parseScheduleSnippet(lines), links);
  return {
    ok: true,
    scheduleUrl,
    schedule,
    links,
    scheduleSnippet: lines.slice(0, 6000),
  };
}

async function scrapeSchedulePlaywright(page, team) {
  const scheduleUrl = `https://scoreboard.clippd.com/teams/${team.clippdId}/schedule`;
  await page.goto(scheduleUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(2000);
  for (let i = 0; i < 6; i += 1) {
    const clicked = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("button, a, div, span")];
      const el = nodes.find((n) => /^\s*load more\s*$/i.test(n.textContent || ""));
      if (!el) return false;
      el.click();
      return true;
    });
    if (!clicked) break;
    await sleep(1500);
  }
  const { tournaments, pageTextSnippet } = await page.evaluate(() => {
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
    return {
      tournaments: [...byId.values()],
      pageTextSnippet: (document.body?.innerText || "").slice(0, 8000),
    };
  });
  const schedule = attachIds(parseScheduleSnippet(pageTextSnippet), tournaments);
  return {
    ok: true,
    scheduleUrl,
    schedule,
    links: tournaments,
    scheduleSnippet: pageTextSnippet?.slice(0, 6000) || null,
  };
}

function keepBetter(prev, scraped) {
  if (!prev) return scraped;
  const prevById = new Map(
    (prev.tournaments || []).map((t) => [t.tournamentId, t]),
  );
  const merged = (scraped.tournaments || []).map((t) => {
    const old = prevById.get(t.tournamentId);
    const newHas =
      (t.players && t.players.length) || t.teamPlace || t.teamTotal != null;
    const oldHas =
      old &&
      ((old.players && old.players.length) ||
        old.teamPlace ||
        old.teamTotal != null);
    if (!newHas && oldHas) return { ...old, lastEmptyAt: scraped.scrapedAt };
    return t;
  });
  for (const [id, old] of prevById) {
    if (!merged.some((t) => t.tournamentId === id)) {
      const oldHas =
        (old.players && old.players.length) ||
        old.teamPlace ||
        old.teamTotal != null;
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

async function scrapeTeam(page, team) {
  console.log(`\n→ ${team.name} (${team.clippdId})`);
  const result = {
    id: team.id,
    name: team.name,
    clippdId: team.clippdId,
    scheduleUrl: `https://scoreboard.clippd.com/teams/${team.clippdId}/schedule`,
    teamUrl: `https://scoreboard.clippd.com/teams/${team.clippdId}`,
    tournaments: [],
    schedule: [],
    error: null,
    scrapedAt: new Date().toISOString(),
  };

  try {
    let sched = await scrapeScheduleHttp(team);
    if ((!sched.ok || (sched.schedule?.length || 0) < 2) && page) {
      console.log("  schedule HTTP thin — trying Playwright");
      sched = await scrapeSchedulePlaywright(page, team);
    }
    if (!sched.ok) {
      result.error = sched.error || "schedule failed";
      return result;
    }

    result.schedule = sched.schedule || [];
    result.scheduleSnippet = sched.scheduleSnippet || null;
    result.scheduleUrl = sched.scheduleUrl;

    const links = (sched.links || []).filter((t) => {
      const n = (t.name || "").toLowerCase();
      if (n.includes("live stream")) return false;
      if (n === "season" || n.startsWith("season ")) return false;
      return true;
    });

    const toVisit = pickToVisit(result.schedule, links);
    console.log(
      `  schedule=${result.schedule.length} links=${links.length} visiting=${toVisit.length}`,
    );

    for (const t of toVisit) {
      console.log(`    · ${t.tournamentId} ${t.name || ""}`);
      const detail = await scrapeTournamentHttp(t.tournamentId, team.name);
      if (!detail.name && t.name) detail.name = t.name;
      if (!detail.dates && t.dates) detail.dates = t.dates;
      if (!detail.venue && t.venue) detail.venue = t.venue;
      result.tournaments.push(detail);
      const scored =
        detail.teamPlace ||
        detail.teamTotal != null ||
        (detail.players && detail.players.length);
      console.log(
        `      status=${detail.status} name=${(detail.name || "").slice(0, 32)} place=${detail.teamPlace || "—"} total=${detail.teamTotal ?? "—"} players=${(detail.players || []).length}${scored ? " ✓" : ""}${detail.error ? " err=" + detail.error : ""}`,
      );
      await sleep(500 + Math.random() * 700);
    }
  } catch (err) {
    result.error = String(err?.message || err);
    console.error(`  ✗ ${team.name}: ${result.error}`);
  }

  return result;
}

async function main() {
  console.log("Clippd scraper v5.2 starting…");
  console.log(
    `  mode=http-stroke  headful=${HEADFUL} recent=${RECENT_ONLY} teams=${TEAMS.length}`,
  );

  const previous = loadPrevious();
  let browser = null;
  let page = null;

  try {
    browser = await chromium.launch({
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
    page = await context.newPage();
  } catch (err) {
    console.log("  Playwright unavailable — schedule HTTP only:", err.message);
  }

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
    await sleep(800 + Math.random() * 600);
  }

  if (browser) await browser.close();

  const allTournaments = Object.values(teams).flatMap((t) => t.tournaments || []);
  const withScores = allTournaments.filter(
    (t) =>
      t.teamPlace || t.teamTotal != null || (t.players && t.players.length > 0),
  );

  const payload = {
    scrapedAt: new Date().toISOString(),
    source: "clippd",
    version: "5.2",
    teams,
    meta: {
      teamCount: TEAMS.length,
      successCount: Object.values(teams).filter((t) => !t.error).length,
      tournamentPagesVisited: allTournaments.length,
      tournamentsWithScores: withScores.length,
      note: "v5.2: stroke boards + fixed place/title/round noise. Scores never invented.",
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
