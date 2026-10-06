#!/usr/bin/env node
/**
 * Clippd college golf scraper (v5.4)
 * --------------------------------
 * HTTP + Chrome UA stroke boards. Visit live/past events AND boards
 * whose tee time is within 48h so confirmed lineups land before round 1.
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data");
const OUT_FILE = join(OUT_DIR, "live-results.json");

import { CLIPPD_TEAMS as TEAMS } from "./watchlist.mjs";

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
  /^(Men|Women|Division|Conference|Head Coach|Ranking|Roster|Schedule|Season|Home|Tournaments|News|Live Streams|Coach Portal|In Partnership|INFORMATION|National|Load more|ScoreboardLive)$/i;
const DIV_LINE = /^(NAIA|NJCAA|NCAA(?:\s+Division)?\s*(I{1,3}|1|2|3))$/i;

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

function decodeEntities(s) {
  let text = String(s || "");
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    rsquo: "'",
    lsquo: "'",
  };
  for (let i = 0; i < 2; i += 1) {
    text = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, n) => {
      const key = String(n).toLowerCase();
      if (named[key]) return named[key];
      if (key.startsWith("#x")) return String.fromCharCode(parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCharCode(Number(key.slice(1)));
      return m;
    });
  }
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

function isPlayerName(line) {
  return /^[A-Z][A-Za-z.'’\u2019\-]+(?:\s+[A-Z][A-Za-z.'’\u2019\-]+)+$/.test(
    decodeEntities(line).trim(),
  );
}

function parseCoursePar(html) {
  if (!html) return null;
  const votes = new Map();
  const re = /totalPar\\?":\[([0-9,]+)\]/g;
  let m;
  while ((m = re.exec(html))) {
    const first = m[1]
      .split(",")
      .map((n) => parseInt(n, 10))
      .find((n) => n >= 67 && n <= 75);
    if (first) votes.set(first, (votes.get(first) || 0) + 1);
  }
  let best = null;
  let bestN = 0;
  for (const [par, n] of votes) {
    if (n > bestN) {
      best = par;
      bestN = n;
    }
  }
  return best;
}

function htmlToLines(html) {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, "\n");
  return text
    .split("\n")
    .map((l) => decodeEntities(l).replace(/\s+/g, " ").trim())
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

function normalizeEventDivision(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\s+/g, " ").trim();
  if (/\bNAIA\b/i.test(s)) return "NAIA";
  if (/\bNJCAA\b/i.test(s)) return "NJCAA";
  if (/division\s*(III|3)\b/i.test(s)) return "NCAA Division III";
  if (/division\s*(II|2)\b/i.test(s) && !/III/i.test(s)) return "NCAA Division II";
  if (/division\s*(I|1)\b/i.test(s)) return "NCAA Division I";
  return null;
}

function eventMatchesTeamDiv(teamDiv, eventDivision, eventName) {
  const eventDiv =
    normalizeEventDivision(eventDivision) || normalizeEventDivision(eventName) || null;
  if (!eventDiv) return true;
  const team = String(teamDiv || "D1").toUpperCase();
  if (eventDiv === "NAIA" || eventDiv === "NJCAA") return team === "NAIA" || team === "NJCAA";
  if (eventDiv === "NCAA Division III") return team === "D3";
  if (eventDiv === "NCAA Division II") return team === "D2";
  if (eventDiv === "NCAA Division I") return team === "D1";
  return true;
}

function formatIsoRange(start, end) {
  if (!start) return null;
  const s = new Date(`${start}T12:00:00Z`);
  const e = new Date(`${end || start}T12:00:00Z`);
  const a = s.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const b = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return start === end || !end ? b : `${a} - ${b}`;
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
    let division = null;
    let j = i + 2;
    while (j < lines.length && !DATE_LINE.test(lines[j])) {
      const t = lines[j];
      if (t.toLowerCase() === "scoreboardlive") scoreboardLive = true;
      else if (DIV_LINE.test(t) || /^NCAA Division/i.test(t)) {
        division = normalizeEventDivision(t) || t;
      } else if (SKIP_LINE.test(t) || /\((Men|Women)\)$/i.test(t)) {
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
      division,
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

function pickToVisit(schedule) {
  // Visit boards that can have a lineup or scores: in-progress, ScoreboardLive,
  // starting within 48h (US tee sheets post the day before), or finished in
  // the lookback window. Timezone-agnostic so an Australia-evening scrape
  // still picks up an Oct 5 Kentucky round.
  const now = Date.now();
  const lookahead = 48 * 3600 * 1000;
  const lookback = 45 * 24 * 3600 * 1000;

  const withIds = schedule.filter((s) => s.tournamentId);

  const scored = withIds
    .map((s) => {
      const range = parseRange(s.dates);
      const start = range?.start?.getTime() ?? (s.start ? Date.parse(s.start) : NaN);
      const end = range?.end?.getTime() ?? (s.end ? Date.parse(s.end) : start);
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return s.scoreboardLive || s.hasResults ? { ...s, priority: 1 } : null;
      }
      const happening = start - lookahead <= now && now <= end + 18 * 3600 * 1000;
      const past = end < now && now - end <= lookback;
      if (happening) return { ...s, priority: 0 };
      if (s.scoreboardLive || s.hasResults) return { ...s, priority: 1 };
      if (past) return { ...s, priority: 2 };
      return null;
    })
    .filter(Boolean);

  scored.sort((a, b) => a.priority - b.priority);
  const chosen = [];
  const seen = new Set();
  for (const s of scored) {
    if (seen.has(s.tournamentId)) continue;
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
  let venue =
    flat.match(/Venue\s*:\s*([^|]+?)(?:\s+Hosted|\s+Division|\s+Scoring|$)/i)?.[1]?.trim() ||
    body.match(/Venue:\s*\n?\s*([^\n<]+)/i)?.[1]?.trim() ||
    null;
  const dates =
    flat.match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*(?:[A-Za-z]+\.?\s+)?\d{1,2})?,?\s*\d{4})/i,
    )?.[1]?.trim() || null;

  if (venue && /self\.__next_f|\$RC\(|StrokeplayLeaderboard/.test(venue)) {
    venue = null;
  }
  if (title && (/^SCOREBOARD$/i.test(title) || /self\.__next_f/.test(title))) {
    title = null;
  }
  return { venue, dates, title };
}

function parseTeamStrokeBoard(html, focusTeam) {
  const flat = stripHoleNoise(htmlToFlat(html));
  const teamStandings = [];
  const seen = new Set();

  const roundTok = (t) => {
    if (!t || /CNCL/i.test(t)) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 50 && n <= 400 ? n : null;
  };

  const pat =
    /(?<![\d])(T?\d{1,2})\s+(?:-\s+|(\d{1,2})\s+)?([A-Z](?:[A-Za-z0-9.&'()\/-]| (?=[A-Za-z(])){1,40}?)\s+(\d{3,4})\s+F\s+(\d{2,3}|CNCL)\s+(\d{2,3}|CNCL)\s+(\d{2,3}|CNCL)(?:\s+(\d{2,3}|CNCL))?(?!\d)/gi;

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

    const rounds = [m[5], m[6], m[7], m[8]].map(roundTok);

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

function isCanceledToken(t) {
  return /^(CNCL|CANCEL+ED|NS|NC)$/i.test(t);
}

function parsePlayerStrokeBoard(html, focusTeam) {
  const lines = htmlToLines(html);
  const players = [];
  let i = 0;
  while (i < lines.length - 4) {
    if (isPlayerName(lines[i]) && teamNameMatch(lines[i + 1], focusTeam)) {
      const name = lines[i];
      const teamLabel = lines[i + 1];
      let place = null;
      for (const back of [2, 1, 3]) {
        if (i >= back && /^T?\d{1,3}$/.test(lines[i - back])) {
          place = lines[i - back];
          break;
        }
      }
      const tokens = [];
      let j = i + 2;
      while (j < lines.length && j < i + 14) {
        const t = lines[j];
        if (
          t === "F" ||
          t === "-" ||
          t === "E" ||
          /^[+-]?\d+$/.test(t) ||
          isCanceledToken(t)
        ) {
          tokens.push(t);
          j += 1;
        } else break;
      }

      // Clippd stroke board: TOTAL  THRU(F)  RD1  RD2  RD3
      const thruIdx = tokens.findIndex((t) => t === "F");
      let total = null;
      let roundToks = [];
      if (thruIdx >= 1 && /^\d{2,4}$/.test(tokens[0])) {
        total = parseInt(tokens[0], 10);
        roundToks = tokens.slice(thruIdx + 1);
      } else {
        roundToks = tokens.filter((t) => /^\d{2,3}$/.test(t) || isCanceledToken(t) || t === "-");
      }

      const rounds = roundToks.map((t) => {
        if (isCanceledToken(t) || t === "-") return null;
        if (/^\d{2,3}$/.test(t)) {
          const n = parseInt(t, 10);
          return n >= 50 && n <= 120 ? n : null;
        }
        return null;
      });

      if (total == null) {
        const played = rounds.filter((n) => n != null);
        if (played.length) total = played.reduce((a, b) => a + b, 0);
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
    par: null,
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
      result.par = parseCoursePar(playerRes.text) || parseCoursePar(teamRes.text);
      if (result.par) result.rawSnippet = `${result.rawSnippet}\nPAR:${result.par}`;
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
        if (data.isComplete && (result.players.some((p) => (p.rounds || []).some((r) => r != null)) || result.teamTotal != null)) {
          result.status = "complete";
        } else if (result.players.length || data.hasResults) {
          result.status = "live";
        }
        if (data.division) result.division = normalizeEventDivision(data.division) || data.division;
      }
    } catch {
      /* optional */
    }

    const hasPosted =
      (result.players || []).some((p) => (p.rounds || []).some((r) => r != null)) ||
      result.teamPlace ||
      result.teamTotal != null;
    const hasLineup = (result.players || []).length > 0;
    if (!result.status) {
      if (hasPosted) result.status = "complete";
      else if (hasLineup) result.status = "live";
      else if (/no players to show yet/i.test(result.rawSnippet || ""))
        result.status = "upcoming";
      else result.status = "unknown";
    }
  } catch (err) {
    result.error = String(err?.message || err);
  }

  return result;
}

async function scrapeScheduleApi(team) {
  const url = `https://scoreboard.clippd.com/api/tournaments?schoolId=${team.clippdId}&season=2027&limit=50`;
  const res = await httpGet(url);
  if (!res.ok) return { ok: false, scheduleUrl: url, error: `API ${res.status}` };
  let data;
  try {
    data = JSON.parse(res.text);
  } catch {
    return { ok: false, scheduleUrl: url, error: "API JSON parse" };
  }
  const schedule = [];
  for (const t of data.results || []) {
    const division = normalizeEventDivision(t.division) || t.division || null;
    if (!eventMatchesTeamDiv(team.div, division, t.tournamentName)) continue;
    const id = t.tournamentId != null ? String(t.tournamentId) : null;
    const dates = formatIsoRange(t.startDate, t.endDate);
    schedule.push({
      name: t.tournamentName || null,
      dates,
      city: [t.city, t.state].filter(Boolean).join(", ") || null,
      venue: t.venue || null,
      scoreboardLive: Boolean(t.hasResults && !t.isComplete),
      hasResults: Boolean(t.hasResults),
      isComplete: Boolean(t.isComplete),
      division,
      start: t.startDate ? `${t.startDate}T00:00:00.000Z` : null,
      end: t.endDate ? `${t.endDate}T00:00:00.000Z` : null,
      tournamentId: id,
      url: id ? `https://scoreboard.clippd.com/tournaments/${id}` : null,
    });
  }
  return {
    ok: schedule.length > 0,
    scheduleUrl: `https://scoreboard.clippd.com/teams/${team.clippdId}/schedule`,
    schedule,
    links: schedule
      .filter((s) => s.tournamentId)
      .map((s) => ({ tournamentId: s.tournamentId, name: s.name, href: s.url })),
    scheduleSnippet: null,
  };
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
    let sched = await scrapeScheduleApi(team);
    if (!sched.ok || (sched.schedule?.length || 0) < 2) {
      const httpSched = await scrapeScheduleHttp(team);
      if (httpSched.ok && (httpSched.schedule?.length || 0) > (sched.schedule?.length || 0)) {
        sched = httpSched;
      }
    }
    if ((!sched.ok || (sched.schedule?.length || 0) < 2) && page) {
      console.log("  schedule HTTP thin — trying Playwright");
      sched = await scrapeSchedulePlaywright(page, team);
    }
    if (!sched.ok) {
      result.error = sched.error || "schedule failed";
      return result;
    }

    result.schedule = (sched.schedule || []).filter((e) =>
      eventMatchesTeamDiv(team.div, e.division, e.name),
    );
    result.scheduleSnippet = sched.scheduleSnippet || null;
    result.scheduleUrl = sched.scheduleUrl;

    const links = (sched.links || []).filter((t) => {
      const n = (t.name || "").toLowerCase();
      if (n.includes("live stream")) return false;
      if (n === "season" || n.startsWith("season ")) return false;
      return true;
    });

    const toVisit = pickToVisit(result.schedule);
    console.log(
      `  schedule=${result.schedule.length} links=${links.length} visiting=${toVisit.length}`,
    );

    for (const t of toVisit) {
      console.log(`    · ${t.tournamentId} ${t.name || ""}`);
      const detail = await scrapeTournamentHttp(t.tournamentId, team.name);
      if (!detail.name && t.name) detail.name = t.name;
      if (!detail.dates && t.dates) detail.dates = t.dates;
      if (!detail.venue && t.venue) detail.venue = t.venue;
      if (!detail.division && t.division) detail.division = t.division;
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
  console.log("Clippd scraper v5.4 starting…");
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
    version: "5.4",
    teams,
    meta: {
      teamCount: TEAMS.length,
      successCount: Object.values(teams).filter((t) => !t.error).length,
      tournamentPagesVisited: allTournaments.length,
      tournamentsWithScores: withScores.length,
      note: "v5.4: drop NAIA/NJCAA from NCAA schedules; visit boards 48h before tee; capture confirmed lineups before round 1.",
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
