import type { Division, Player, Program, RecruitCommit, Year } from "@/data/types";
import type { LiveTeam, LiveTournament } from "@/lib/live";
import { eventMatchesProgramDivision, normalizeEventDivision } from "@/lib/division";
import { decodeEntities, isPlayerName, parseCoursePar } from "@/lib/clippd-text";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const YEAR_MAP: Record<string, Year> = {
  "first year": "Fr",
  freshman: "Fr",
  "second year": "So",
  sophomore: "So",
  "third year": "Jr",
  junior: "Jr",
  "fourth year": "Sr",
  senior: "Sr",
  "fifth year": "5th",
  graduate: "Gr",
  "redshirt freshman": "Fr",
  "redshirt sophomore": "So",
  "redshirt junior": "R-Jr",
};

const CGC_BY_LETTER: Record<string, string> = {
  a: "2027boysd1a",
  b: "2027boysd1b",
  c: "2027boysd1c",
  d: "2027boysd1de",
  e: "2027boysd1de",
  f: "2027boysd1fg",
  g: "2027boysd1fg",
  h: "2027boysd1hj",
  i: "2027boysd1hj",
  j: "2027boysd1hj",
  k: "2027boysd1kl",
  l: "2027boysd1kl",
  m: "2027boysd1m",
  n: "2027boysd1n",
  o: "2027boysd1or",
  p: "2027boysd1or",
  q: "2027boysd1or",
  r: "2027boysd1or",
  s: "2027boysd1s",
  t: "2027boysd1tv",
  u: "2027boysd1tv",
  v: "2027boysd1tv",
  w: "2027boysd1wz",
  x: "2027boysd1wz",
  y: "2027boysd1wz",
  z: "2027boysd1wz",
};

async function httpGet(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  return { ok: res.ok, status: res.status, text: await res.text(), url };
}

function htmlToLines(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((l) => decodeEntities(l).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function htmlToFlat(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHoleNoise(s: string) {
  return s.replace(/\b(?:OUT|IN|RD)\b/g, " ");
}

export function parseClippdTeamId(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const fromUrl = raw.match(/clippd\.com\/teams\/(\d+)/i);
  if (fromUrl) return fromUrl[1];
  if (/^\d{3,6}$/.test(raw)) return raw;
  return null;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function nameTokens(name: string) {
  return String(name || "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !["the", "university", "of", "college"].includes(t));
}

function namesMatch(a: string, b: string) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return false;
  const sa = new Set(ta);
  const overlap = tb.filter((t) => sa.has(t)).length;
  return overlap >= Math.min(2, Math.min(ta.length, tb.length)) || overlap >= Math.min(ta.length, tb.length);
}

function lineValue(lines: string[], label: string): string {
  const i = lines.findIndex((l) => l.replace(/:$/, "").toLowerCase() === label.toLowerCase());
  if (i < 0) {
    const inline = lines.find((l) => new RegExp(`^${label}\\s*:`, "i").test(l));
    return inline ? inline.replace(new RegExp(`^${label}\\s*:\\s*`, "i"), "").trim() : "";
  }
  for (let j = i + 1; j < lines.length && j < i + 5; j++) {
    const t = lines[j];
    if (!t || t === ":") continue;
    if (/^(division|conference|head coach|ranking|roster|schedule|season|men)$/i.test(t)) continue;
    return t;
  }
  return "";
}

function parseMeta(lines: string[]) {
  const blob = lines.join("\n");
  const title =
    blob.match(/SCOREBOARD\s*[-–]\s*(.+?)\s*\(\s*Men\s*\)/i)?.[1]?.trim() || null;
  const divRaw = lineValue(lines, "Division");
  const div: Division = /III|D3/i.test(divRaw) ? "D3" : "D1";
  return {
    name: title,
    div,
    conf: lineValue(lines, "Conference") || "—",
    coach: lineValue(lines, "Head Coach") || "—",
  };
}

function parseRoster(lines: string[], programId: string): Player[] {
  const start = lines.findIndex((l) => l === "School Year" || l === "Player");
  const slice = start >= 0 ? lines.slice(start + 1) : lines;
  const players: Player[] = [];
  for (let i = 0; i < slice.length - 1; i++) {
    const name = slice[i];
    const yearRaw = slice[i + 1];
    const yearKey = yearRaw.toLowerCase();
    if (!isPlayerName(name) || !YEAR_MAP[yearKey]) continue;
    if (/ranking|roster|schedule|scoreboard|clippd/i.test(name)) continue;
    players.push({
      id: `${programId}-${slug(name)}`,
      name,
      year: YEAR_MAP[yearKey],
      hometown: "—",
      signal:
        yearKey.includes("fourth") || yearKey.includes("fifth") || yearKey.includes("senior")
          ? "Senior / eligibility watch"
          : yearKey.includes("first")
            ? "Development"
            : "Core return",
    });
    i += 1;
  }
  return players;
}

function formatIsoRange(start: string | null, end: string | null): string {
  if (!start) return "TBA";
  const s = new Date(`${start}T12:00:00Z`);
  const e = new Date(`${end || start}T12:00:00Z`);
  const same = start === end || !end;
  const a = s.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const b = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return same ? b : `${a}–${b}`;
}

interface ClippdApiEvent {
  tournamentId?: string | number;
  tournamentName?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  city?: string;
  state?: string;
  hasResults?: boolean;
  isComplete?: boolean;
  division?: string;
}

async function fetchScheduleApi(clippdId: string): Promise<LiveTournament[]> {
  const url = `https://scoreboard.clippd.com/api/tournaments?schoolId=${clippdId}&season=2027&limit=50`;
  const res = await httpGet(url);
  if (!res.ok) return [];
  let data: { results?: ClippdApiEvent[] } = {};
  try {
    data = JSON.parse(res.text) as { results?: ClippdApiEvent[] };
  } catch {
    return [];
  }
  return (data.results || []).map((t) => {
    const id = t.tournamentId != null ? String(t.tournamentId) : null;
    const venueBits = [t.venue, t.city].filter(Boolean);
    return {
      tournamentId: id,
      name: t.tournamentName || null,
      dates: formatIsoRange(t.startDate || null, t.endDate || null),
      venue: venueBits.join(" · ") || null,
      city: t.city || null,
      url: id ? `https://scoreboard.clippd.com/tournaments/${id}` : null,
      status: t.isComplete ? "complete" : t.hasResults ? "live" : "upcoming",
      scoreboardLive: Boolean(t.hasResults && !t.isComplete),
      division: normalizeEventDivision(t.division) || t.division || null,
      players: [],
    };
  });
}

function isCanceledToken(t: string) {
  return /^(CNCL|CANCEL+ED|NS|NC)$/i.test(t);
}

function parsePlayerStrokeBoard(html: string, focusTeam: string) {
  const lines = htmlToLines(html);
  const players = [];
  let i = 0;
  while (i < lines.length - 4) {
    if (isPlayerName(lines[i]) && namesMatch(lines[i + 1], focusTeam)) {
      const name = lines[i];
      const teamLabel = lines[i + 1];
      let place: string | null = null;
      for (const back of [2, 1, 3]) {
        if (i >= back && /^T?\d{1,3}$/.test(lines[i - back])) {
          place = lines[i - back];
          break;
        }
      }
      const tokens: string[] = [];
      let j = i + 2;
      while (j < lines.length && j < i + 14) {
        const t = lines[j];
        if (t === "F" || t === "-" || t === "E" || /^[+-]?\d+$/.test(t) || isCanceledToken(t)) {
          tokens.push(t);
          j += 1;
        } else break;
      }
      const thruIdx = tokens.findIndex((t) => t === "F");
      let total: number | null = null;
      let roundToks: string[] = [];
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
      players.push({
        name,
        rounds,
        total,
        finish: place,
        role: /\(IND\)/i.test(teamLabel) ? "ind" : "team",
      });
      i = j;
      continue;
    }
    i += 1;
  }
  return players;
}

async function scrapeTournament(tournamentId: string, teamName: string): Promise<LiveTournament> {
  const hub = `https://scoreboard.clippd.com/tournaments/${tournamentId}`;
  const teamUrl = `${hub}/scoring/team?displayMode=stroke`;
  const playerUrl = `${hub}/scoring/player?displayMode=stroke`;
  const out: LiveTournament = { tournamentId, url: teamUrl, players: [] };
  try {
    const [teamRes, playerRes] = await Promise.all([httpGet(teamUrl), httpGet(playerUrl)]);
    const flat = stripHoleNoise(htmlToFlat(teamRes.text));
    out.rawSnippet = flat.slice(0, 4000);
    const title = teamRes.text.match(
      /SCOREBOARD\s*[-–]\s*(.+?)\s*(?:\(\s*(?:Men|Women)\s*\))?\s*(?:Team|Player)\s*Leaderboard/i,
    );
    out.name = title?.[1]?.trim() || null;
    out.dates =
      flat.match(
        /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*(?:[A-Za-z]+\.?\s+)?\d{1,2})?,?\s*\d{4})/i,
      )?.[1] || null;
    if (playerRes.ok) {
      out.players = parsePlayerStrokeBoard(playerRes.text, teamName).slice(0, 40);
    }
    const par = parseCoursePar(playerRes.ok ? playerRes.text : teamRes.text);
    if (par) out.par = par;
    if (out.players?.length) out.status = "complete";
  } catch (err) {
    out.error = String((err as Error).message || err);
  }
  return out;
}

function cgcLines(html: string) {
  const ent: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', nbsp: " " };
  let text = html;
  for (let i = 0; i < 2; i++) {
    text = text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, n: string) => ent[n.toLowerCase()] || m);
  }
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|h[1-6]|li|div)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normSchool(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|university|univ|college|of)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCgcPlayers(lines: string[]) {
  const out: { name: string; hometown: string; school: string; note: string }[] = [];
  let school: string | null = null;
  let current: { name: string; hometown: string; notes: string[] } | null = null;
  const flush = () => {
    if (current && school) {
      out.push({
        name: current.name,
        hometown: current.hometown,
        school,
        note: current.notes.slice(0, 3).join("; "),
      });
    }
    current = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/⭐️/g, "⭐").trim();
    if (line.startsWith("-") && /(university|college|state|mellon)/i.test(line)) {
      flush();
      school = line.replace(/^[-–—]+\s*/, "").trim();
      continue;
    }
    const pm = line.match(/^⭐\s*(.+?),\s*2027\s*$/);
    if (pm) {
      flush();
      current = { name: pm[1].trim(), hometown: "", notes: [] };
      continue;
    }
    const compact = line.match(/^(.{3,80}?):\s*([A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+){0,3}),\s*(.+)$/);
    if (compact && /(university|college|state|mellon|baylor)/i.test(compact[1])) {
      flush();
      school = compact[1].trim();
      out.push({ name: compact[2].trim(), hometown: compact[3].trim(), school, note: "" });
      continue;
    }
    if (current) {
      if (!current.hometown) current.hometown = line;
      else current.notes.push(line);
    }
  }
  flush();
  return out;
}

function schoolMatches(school: string, aliases: string[]) {
  const n = normSchool(school);
  return aliases.some((a) => {
    const x = normSchool(a);
    return n === x || (x.split(" ").length >= 2 && n.startsWith(x + " "));
  });
}

function aliasesFor(name: string) {
  const n = name.replace(/\s*\(Men\)\s*/i, "").trim();
  return [n, `${n} university`, `university of ${n}`, `${n} state`, `${n} college`];
}

async function scrapeCommitsFor(name: string, programId: string): Promise<RecruitCommit[]> {
  const letter =
    name.replace(/^(university|college)\s+of\s+/i, "").trim()[0]?.toLowerCase() || "a";
  const pages = [CGC_BY_LETTER[letter] || "2027boysd1a", "2027boysd2", "2027boysd3"];
  const aliases = aliasesFor(name);
  const found: RecruitCommit[] = [];
  for (const slugPage of pages) {
    try {
      const url = `https://collegegolfcommits.com/${slugPage}`;
      const page = await httpGet(url);
      if (!page.ok) continue;
      for (const row of parseCgcPlayers(cgcLines(page.text))) {
        if (!schoolMatches(row.school, aliases)) continue;
        found.push({
          id: `${programId}-c-${slug(row.name)}`,
          name: row.name,
          classYear: 2027,
          hometown: row.hometown || "",
          status: "verbal",
          source: "College Golf Commits",
          sourceUrl: url,
          note: row.note || "",
        });
      }
    } catch {
      /* best-effort */
    }
  }
  return found;
}

export interface ImportedCollege {
  program: Program;
  live: LiveTeam;
}

export async function importCollegeFromClippd(
  input: string,
  takenIds: string[] = [],
  takenClippdIds: string[] = [],
): Promise<ImportedCollege> {
  const clippdId = parseClippdTeamId(input);
  if (!clippdId) {
    throw new Error("Paste a Clippd team URL or numeric team id (e.g. 3916).");
  }
  if (takenClippdIds.includes(clippdId)) {
    throw new Error("That Clippd team is already on the watch list.");
  }

  const teamUrl = `https://scoreboard.clippd.com/teams/${clippdId}`;
  const rosterUrl = `${teamUrl}/roster`;
  const scheduleUrl = `${teamUrl}/schedule`;

  const [teamPage, rosterPage, rawSchedule] = await Promise.all([
    httpGet(teamUrl),
    httpGet(rosterUrl),
    fetchScheduleApi(clippdId),
  ]);
  if (!teamPage.ok) throw new Error(`Clippd team ${clippdId} returned HTTP ${teamPage.status}`);

  const meta = parseMeta(htmlToLines(teamPage.text));
  const name = meta.name || `Clippd ${clippdId}`;
  let id = slug(name);
  if (!id || takenIds.includes(id)) id = `c${clippdId}`;

  const players = parseRoster(htmlToLines(rosterPage.text), id);
  const seniors = players.filter((p) => p.year === "Sr" || p.year === "5th" || p.year === "Gr").length;

  const schedule = rawSchedule.filter((e) =>
    eventMatchesProgramDivision(meta.div, e.division, e.name),
  );
  const now = Date.now();
  const toVisit = schedule
    .filter((e) => {
      if (!e.tournamentId) return false;
      if (e.status === "complete" || e.status === "live" || e.scoreboardLive) return true;
      const start = e.dates ? Date.parse(e.dates) : NaN;
      return Number.isFinite(start) && start - now <= 48 * 3600_000;
    })
    .slice(0, 4);
  const boards = await Promise.all(toVisit.map((e) => scrapeTournament(String(e.tournamentId), name)));
  const tournaments = schedule.map((ev) => {
    const board = boards.find((b) => b.tournamentId === ev.tournamentId);
    return board
      ? { ...ev, ...board, name: board.name || ev.name, dates: ev.dates || board.dates }
      : ev;
  });

  const commits = await scrapeCommitsFor(name, id);

  const program: Program = {
    id,
    name,
    short: name.replace(/^University of /i, "").replace(/ University$/i, ""),
    div: meta.div,
    conf: meta.conf,
    coach: meta.coach,
    clippd: teamUrl,
    clippdSchedule: scheduleUrl,
    rosterUrl,
    seniors: seniors || null,
    intel: `Added from Clippd team ${clippdId}. Roster years come from Clippd; use Refresh scores for new cards. The 6am GitHub job still follows the shared watchlist — pin this school there if you want it updated for everyone.`,
    players,
    events: [],
    insights: [
      {
        id: `${id}-added`,
        tone: "info",
        title: "Imported from Clippd",
        body: `${players.length} players on the Clippd roster (${seniors} listed as 4th/5th year). Scores below are live-scraped — lineup probability firms up after two counting cards.`,
        evidence: teamUrl,
        confidence: "inferred",
        playerIds: [],
      },
    ],
    commits,
    custom: true,
    clippdTeamId: clippdId,
    clippdScrapedAt: new Date().toISOString(),
  };

  const live: LiveTeam = {
    id,
    name,
    clippdId,
    scheduleUrl,
    teamUrl,
    tournaments,
    schedule,
    scrapedAt: new Date().toISOString(),
  };

  return { program, live };
}
