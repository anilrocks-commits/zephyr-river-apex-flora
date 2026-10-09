import type {
  EventStatus,
  Player,
  PlayerRound,
  Program,
  Role,
  Tournament,
} from "@/data/types";
import rawLive from "../../public/data/live-results.json";
import {
  divisionFromSnippet,
  eventMatchesProgramDivision,
  isDivisionLine,
  normalizeEventDivision,
} from "@/lib/division";
import { parseCoursePar } from "@/lib/clippd-text";
import { trimStrokeRounds } from "@/lib/stroke-rounds";

export interface LivePlayerScore {
  name: string;
  rounds: (number | null)[];
  total?: number | null;
  toPar?: string | number | null;
  finish?: string | null;
  role?: Role | string | null;
}

export interface LiveTournament {
  tournamentId?: string | null;
  url?: string | null;
  name?: string | null;
  dates?: string | null;
  venue?: string | null;
  status?: string | null;
  teamPlace?: string | number | null;
  teamTotal?: number | null;
  teamToPar?: string | number | null;
  teamRounds?: (number | null)[];
  players?: LivePlayerScore[];
  teamStandings?: { place?: string; team?: string }[];
  error?: string | null;
  rawSnippet?: string | null;
  scoreboardLive?: boolean;
  city?: string | null;
  division?: string | null;
  hasResults?: boolean;
  isComplete?: boolean;
  par?: number | null;
  roundsPlanned?: number | null;
}

export interface LiveTeam {
  id: string;
  name: string;
  clippdId?: string;
  scheduleUrl?: string;
  teamUrl?: string;
  tournaments?: LiveTournament[];
  schedule?: LiveTournament[];
  scheduleSnippet?: string | null;
  scrapedAt?: string;
}

export interface LiveResultsFile {
  scrapedAt: string;
  source?: string;
  version?: number;
  teams: Record<string, LiveTeam>;
}

export const LIVE_RESULTS = rawLive as unknown as LiveResultsFile;

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DATE_LINE =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:\s*[-–]\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{1,2}))?,\s*(\d{4})$/i;

const SKIP_LINE =
  /^(Men|Women|Division|Conference|Head Coach|Ranking|Roster|Schedule|Season|Home|Tournaments|News|Live Streams|Coach Portal|In Partnership|INFORMATION|National|Load more|ScoreboardLive)$/i;

const NOISE_WORDS = new Set([
  "the",
  "presented",
  "by",
  "invitational",
  "invite",
  "intercollegiate",
  "classic",
  "memorial",
  "championship",
  "collegiate",
  "golf",
  "trips",
  "mens",
  "men",
  "womens",
  "at",
  "and",
  "of",
]);

export function parseToPar(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).trim();
  if (!s || s === "—" || s === "-") return null;
  if (/^e$/i.test(s)) return 0;
  const n = Number(s.replace(/^\+/, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseEventRange(
  dates: string | null | undefined,
): { start: Date; end: Date } | null {
  if (!dates) return null;
  const normalized = dates.trim().replace(/[–—]/g, "-");
  const m = normalized.match(DATE_LINE);
  if (!m) return null;
  const year = Number(m[5]);
  const startMonth = MONTHS[m[1].slice(0, 3).toLowerCase()];
  const startDay = Number(m[2]);
  const endMonth = MONTHS[(m[3] || m[1]).slice(0, 3).toLowerCase()];
  const endDay = m[4] ? Number(m[4]) : startDay;
  if (!startMonth || !endMonth) return null;
  return {
    start: new Date(year, startMonth - 1, startDay),
    end: new Date(year, endMonth - 1, endDay),
  };
}

/** 2026-27 NCAA season — fall golf starts in August. */
export const SEASON_START = new Date(2026, 7, 1);

export function isSeasonEvent(
  dates: string | null | undefined,
  name?: string | null,
): boolean {
  if (name && /prior spring|2025[-–\/]26/i.test(name)) return false;
  const range = parseEventRange(dates);
  if (range) return range.start.getTime() >= SEASON_START.getTime();
  const raw = dates || "";
  if (/spring\s*2026/i.test(raw) && !/2027/.test(raw)) return false;
  const year = raw.match(/\b(20\d{2})\b/);
  if (year && Number(year[1]) < 2026) return false;
  if (
    year &&
    Number(year[1]) === 2026 &&
    /(jan|feb|mar|apr|may|jun|jul)/i.test(raw) &&
    !/(aug|sep|oct|nov|dec|fall)/i.test(raw)
  ) {
    return false;
  }
  return true;
}

export function eventStatusFromDates(
  dates: string,
  hasScores: boolean,
  today = new Date(),
  opts?: { scoreboardLive?: boolean; hasLineup?: boolean },
): EventStatus {
  const range = parseEventRange(dates);
  if (!range) return hasScores ? "complete" : "upcoming";
  // College golf dates are US calendar days. Compare in Eastern so an
  // Australia-evening scrape does not treat an Oct 5 Kentucky tee time as "tomorrow".
  const ymd = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const pad = (n: number) => String(n).padStart(2, "0");
  const cal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayY = ymd(today);
  const startY = cal(range.start);
  const endY = cal(range.end);
  if (todayY < startY) {
    if (opts?.scoreboardLive || opts?.hasLineup) {
      const startUtc = Date.UTC(
        range.start.getFullYear(),
        range.start.getMonth(),
        range.start.getDate(),
      );
      if (startUtc - today.getTime() <= 48 * 3600_000) return "live";
    }
    return "upcoming";
  }
  if (todayY > endY) return hasScores ? "complete" : "historical";
  return "live";
}

/** Surname particles that may be spaced or fused: "De Jesus" ↔ "DeJesus" */
const NAME_PARTICLES = new Set([
  "de",
  "da",
  "di",
  "du",
  "del",
  "della",
  "van",
  "von",
  "la",
  "le",
  "el",
  "st",
  "ste",
  "mc",
  "mac",
]);

function nameTokens(name: string): string[] {
  const raw = name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b\d+(st|nd|rd|th)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Fuse particle + next token so "de jesus" and "dejesus" share a last token
  const fused: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i];
    if (NAME_PARTICLES.has(t) && i + 1 < raw.length) {
      fused.push(t + raw[i + 1]);
      i += 1;
      continue;
    }
    fused.push(t);
  }

  return fused.filter((t) => t.length > 1 && !NOISE_WORDS.has(t));
}

export function namesMatch(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return false;
  const sa = new Set(ta);
  const overlap = tb.filter((t) => sa.has(t)).length;
  const min = Math.min(ta.length, tb.length);
  if (overlap >= min && min >= 1) return true;
  if (overlap >= 2) return true;
  const na = ta.join(" ");
  const nb = tb.join(" ");
  return na.includes(nb) || nb.includes(na);
}

function datesOverlap(a?: string | null, b?: string | null): boolean {
  const ra = parseEventRange(a);
  const rb = parseEventRange(b);
  if (!ra || !rb) return false;
  return ra.start.getTime() === rb.start.getTime() || ra.end.getTime() === rb.end.getTime();
}

export function parseScheduleSnippet(snippet: string | null | undefined): LiveTournament[] {
  if (!snippet) return [];
  const lines = snippet
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const events: LiveTournament[] = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(DATE_LINE);
    if (!m) {
      i += 1;
      continue;
    }
    const dates = lines[i];
    const name = lines[i + 1] ?? null;
    const extras: string[] = [];
    let scoreboardLive = false;
    let division: string | null = null;
    let j = i + 2;
    while (j < lines.length && !DATE_LINE.test(lines[j])) {
      const t = lines[j];
      if (t.toLowerCase() === "scoreboardlive") scoreboardLive = true;
      else if (isDivisionLine(t) || /^NCAA Division/i.test(t)) {
        division = normalizeEventDivision(t) || t;
      } else if (SKIP_LINE.test(t) || /\((Men|Women)\)$/i.test(t)) {
        /* nav / gender chrome */
      } else extras.push(t);
      j += 1;
    }
    events.push({
      name,
      dates,
      city: extras[0] ?? null,
      venue: extras[1] ?? extras[0] ?? null,
      scoreboardLive,
      division,
      players: [],
      teamRounds: [],
    });
    i = j;
  }
  return events;
}

function snippetMeta(snippet: string | null | undefined): {
  venue: string | null;
  dates: string | null;
} {
  if (!snippet) return { venue: null, dates: null };
  const venue =
    snippet.match(/Venue\s*:\s*([^|\n]+)/i)?.[1]?.trim() ||
    null;
  const dates =
    snippet.match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*(?:[A-Za-z]+\.?\s+)?\d{1,2})?,?\s*\d{4})/i,
    )?.[1]?.trim() || null;
  return { venue, dates };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function matchPlayer(players: Player[], name: string): Player | undefined {
  const tokens = nameTokens(name);
  const n = tokens.join(" ");
  const exact = players.find((p) => nameTokens(p.name).join(" ") === n);
  if (exact) return exact;

  // Unique last-token match ("dejesus" from both "De Jesus" and "DeJesus")
  const last = tokens.at(-1);
  if (last) {
    const lasts = players.filter((p) => nameTokens(p.name).at(-1) === last);
    if (lasts.length === 1) return lasts[0];
  }

  // First + last when middle names differ
  if (tokens.length >= 2) {
    const first = tokens[0];
    const lastTok = tokens[tokens.length - 1];
    const hits = players.filter((p) => {
      const pt = nameTokens(p.name);
      return pt[0] === first && pt[pt.length - 1] === lastTok;
    });
    if (hits.length === 1) return hits[0];
  }

  return undefined;
}

function canceledRoundFlags(live: LiveTournament): boolean[] {
  const blob = live.rawSnippet || "";
  const flags = [false, false, false, false];
  const re = /Round\s+(\d+)\s+Cancel+ed/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blob))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 4) flags[n - 1] = true;
  }
  return flags;
}

function applyCanceledRounds(
  rounds: (number | null)[],
  flags: boolean[],
): (number | null)[] {
  const lastFlag = flags.lastIndexOf(true);
  const len = Math.max(rounds.length, lastFlag + 1);
  if (len <= 0) return rounds;
  return Array.from({ length: len }, (_, i) =>
    flags[i] ? null : rounds[i] ?? null,
  );
}

function playedTotal(rounds: (number | null)[], fallback: number | null): number | null {
  const played = rounds.filter((r): r is number => r != null);
  if (played.length === 1) return played[0];
  if (played.length > 1) return played.reduce((a, b) => a + b, 0);
  return fallback;
}

function salvageTeamFromSnippet(
  live: LiveTournament,
  teamName: string,
): LiveTournament {
  if (live.teamPlace != null && (live.teamRounds?.length ?? 0) > 0) return live;
  const blob = live.rawSnippet || "";
  if (!blob || !teamName) return live;
  const escaped = teamName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(T?\\d{1,2})\\s+-\\s+${escaped}\\s+(\\d{3,4})\\s+F\\s+(\\d{2,4}|CNCL)\\s+(\\d{2,4}|CNCL)\\s+(\\d{2,4}|CNCL)`,
    "i",
  );
  const m = blob.match(re);
  if (!m) return live;
  const tok = (t: string) => (/CNCL/i.test(t) ? null : Number(t));
  return {
    ...live,
    teamPlace: live.teamPlace ?? m[1],
    teamTotal: live.teamTotal ?? Number(m[2]),
    teamRounds:
      live.teamRounds && live.teamRounds.length
        ? live.teamRounds
        : [tok(m[3]), tok(m[4]), tok(m[5])],
  };
}

function resolvePar(live: LiveTournament, fallback?: number | null): number {
  if (live.par && live.par >= 67 && live.par <= 75) return live.par;
  const fromSnippet = parseCoursePar(live.rawSnippet);
  if (fromSnippet) return fromSnippet;
  if (fallback && fallback >= 67 && fallback <= 75) return fallback;
  return 72;
}

function liveScoresToRows(program: Program, live: LiveTournament, par?: number): PlayerRound[] {
  const flags = canceledRoundFlags(live);
  const players = live.players ?? [];
  const rows: PlayerRound[] = players.map((p) => {
    const matched = matchPlayer(program.players, p.name);
    const role: Role = p.role === "ind" ? "ind" : p.role === "dnp" ? "dnp" : "team";
    const raw = (p.rounds ?? []).map((r) => (Number.isFinite(r) ? r : null));
    const rounds = trimStrokeRounds(
      applyCanceledRounds(raw, flags),
      typeof p.total === "number" ? p.total : null,
      live.roundsPlanned,
    );
    const toPar =
      parseToPar(p.toPar) ??
      (par
        ? rounds.reduce<number | null>((acc, r) => {
            if (r == null) return acc;
            return (acc ?? 0) + (r - par);
          }, null)
        : null);
    return {
      playerId: matched?.id ?? `clippd:${slug(p.name)}`,
      playerName: p.name,
      role,
      rounds,
      toPar,
      finish: p.finish ?? null,
      counted: rounds.map(() => null),
    };
  });
  return inferCounted(rows);
}

function inferCounted(rows: PlayerRound[]): PlayerRound[] {
  const teamIdx = rows
    .map((row, i) => (row.role === "team" ? i : -1))
    .filter((i) => i >= 0);
  if (teamIdx.length < 5) return rows;
  const roundCount = Math.max(0, ...rows.map((r) => r.rounds.length));
  const next = rows.map((r) => ({ ...r, counted: [...r.counted] }));
  for (let r = 0; r < roundCount; r += 1) {
    const entries = teamIdx
      .map((i) => ({ i, v: next[i].rounds[r] }))
      .filter((e) => e.v != null)
      .sort((a, b) => (a.v as number) - (b.v as number));
    const drop = entries.length >= 5 ? entries[entries.length - 1].i : -1;
    for (const i of teamIdx) {
      next[i].counted[r] = next[i].rounds[r] != null ? i !== drop : null;
    }
  }
  return next;
}

function hasPostedScores(event: Pick<Tournament, "scores" | "teamPlace" | "teamTotal">): boolean {
  if (event.teamPlace || event.teamTotal != null) return true;
  return event.scores.some((s) => s.rounds.some((r) => r != null));
}

function isGarbageLive(live: LiveTournament): boolean {
  const blob = `${live.name || ""} ${live.venue || ""} ${live.rawSnippet || ""}`;
  if (/self\.__next_f|\$RC\(|StrokeplayLeaderboard/.test(blob)) return true;
  if (live.name && /^SCOREBOARD$/i.test(live.name.trim())) return true;
  if (live.error === "skipped-future-empty" || live.error === "empty-board-noise") return true;
  const hasScores =
    Boolean(live.players?.length) || live.teamTotal != null || live.teamPlace != null;
  if (!hasScores && live.dates) {
    const range = parseEventRange(live.dates);
    if (range) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (range.start > today && (!live.name || /^SCOREBOARD$/i.test(live.name.trim()))) {
        return true;
      }
    }
  }
  return false;
}

function formatVenue(live: LiveTournament): string {
  const venue = live.venue?.trim();
  if (!venue) return live.city?.trim() || "Venue TBA";
  if (live.city && !venue.toLowerCase().includes(live.city.split(",")[0].toLowerCase())) {
    return `${venue} · ${live.city}`;
  }
  return venue.replace(/\s+-\s+/g, " · ");
}

function overlayPage(schedule: LiveTournament, page?: LiveTournament | null): LiveTournament {
  if (!page) return schedule;
  const meta = snippetMeta(page.rawSnippet);
  const players = page.players?.length ? page.players : schedule.players;
  const hasBoard =
    Boolean(page.teamPlace) ||
    Boolean(page.teamTotal) ||
    Boolean(page.players?.length);
  return {
    ...schedule,
    ...page,
    name: page.name || schedule.name,
    dates: page.dates || meta.dates || schedule.dates,
    venue: page.venue || meta.venue || schedule.venue,
    city: schedule.city,
    scoreboardLive: schedule.scoreboardLive || page.scoreboardLive,
    division: page.division || schedule.division,
    par: page.par || schedule.par,
    players,
    teamRounds: page.teamRounds?.length ? page.teamRounds : schedule.teamRounds,
    url: page.url || schedule.url,
    tournamentId: page.tournamentId || schedule.tournamentId,
    teamPlace: page.teamPlace ?? schedule.teamPlace,
    teamTotal: page.teamTotal ?? schedule.teamTotal,
    teamToPar: page.teamToPar ?? schedule.teamToPar,
    teamStandings: page.teamStandings?.length ? page.teamStandings : schedule.teamStandings,
    rawSnippet: page.rawSnippet || schedule.rawSnippet,
    status: hasBoard ? page.status || schedule.status : schedule.status,
  };
}

function liveEventToTournament(
  program: Program,
  live: LiveTournament,
  scrapedAt: string,
): Tournament {
  live = salvageTeamFromSnippet(live, program.name);
  const flags = canceledRoundFlags(live);
  const par = resolvePar(live);
  const scores = liveScoresToRows(program, live, par);
  const dates = live.dates || "TBA";
  const teamRounds = trimStrokeRounds(
    applyCanceledRounds(live.teamRounds ?? [], flags),
    live.teamTotal ?? null,
    live.roundsPlanned,
  );
  const hasPosted =
    scores.some((s) => s.rounds.some((r) => r != null)) || live.teamTotal != null;
  const hasLineup = scores.length > 0;
  const id = live.tournamentId
    ? `${program.id}-clippd-${live.tournamentId}`
    : `${program.id}-${slug(live.name || dates)}`;
  const canceledNote = flags.some(Boolean)
    ? `Round ${flags.map((c, i) => (c ? i + 1 : null)).filter(Boolean).join("–")} cancelled.`
    : null;
  return {
    id,
    name: live.name || "Unnamed tournament",
    dates,
    venue: formatVenue(live),
    par,
    fieldTeams: live.teamStandings?.length || null,
    fieldPlayers: null,
    status: eventStatusFromDates(dates, hasPosted, new Date(), {
      scoreboardLive: live.scoreboardLive,
      hasLineup,
    }),
    teamPlace: live.teamPlace != null ? String(live.teamPlace) : null,
    teamRounds,
    teamTotal: playedTotal(teamRounds, live.teamTotal ?? null),
    teamToPar: parseToPar(live.teamToPar),
    scores,
    source: "clippd",
    sourceLabel: hasPosted
      ? `Clippd scoreboard · ${formatScraped(scrapedAt)}`
      : hasLineup
        ? `Clippd lineup · ${formatScraped(scrapedAt)}`
        : "Clippd schedule",
    sourceUrl: live.url || program.clippdSchedule,
    clippdUrl: live.url || program.clippdSchedule,
    clippdTournamentId: live.tournamentId ?? undefined,
    canceledRounds: flags.some(Boolean) ? flags : undefined,
    note: canceledNote || undefined,
  };
}

function mergeOne(
  program: Program,
  curated: Tournament | null,
  live: LiveTournament | null,
  scrapedAt: string,
): Tournament {
  if (!curated && live) return liveEventToTournament(program, live, scrapedAt);
  if (curated && !live) {
    const hasScores = hasPostedScores(curated);
    return {
      ...curated,
      status: eventStatusFromDates(curated.dates, hasScores) === "live"
        ? "live"
        : curated.status === "historical"
          ? "historical"
          : eventStatusFromDates(curated.dates, hasScores),
    };
  }
  const liveEvent = salvageTeamFromSnippet(live as LiveTournament, program.name);
  const base = curated as Tournament;
  const flags = canceledRoundFlags(liveEvent);
  const par = resolvePar(liveEvent, base.par);
  const liveRows = liveScoresToRows(program, liveEvent, par);
  const liveHasPosted =
    liveRows.some((s) => s.rounds.some((r) => r != null)) || liveEvent.teamTotal != null;
  const liveHasLineup = liveRows.length > 0;
  const scores = liveHasPosted || liveHasLineup ? liveRows : base.scores;
  const dates = liveEvent.dates || base.dates;
  const teamRounds = trimStrokeRounds(
    applyCanceledRounds(
      liveEvent.teamRounds?.length ? liveEvent.teamRounds : base.teamRounds,
      flags,
    ),
    liveEvent.teamTotal ?? base.teamTotal,
    liveEvent.roundsPlanned,
  );
  const hasScores = hasPostedScores({
    ...base,
    scores,
    teamPlace: liveEvent.teamPlace != null ? String(liveEvent.teamPlace) : base.teamPlace,
    teamTotal: liveEvent.teamTotal ?? base.teamTotal,
  });
  const cancelLabel = flags
    .map((c, i) => (c ? `R${i + 1}` : null))
    .filter(Boolean)
    .join(" and ");
  return {
    ...base,
    name: base.name,
    dates,
    venue: base.venue || formatVenue(liveEvent),
    par,
    status: eventStatusFromDates(dates, hasScores, new Date(), {
      scoreboardLive: liveEvent.scoreboardLive,
      hasLineup: scores.length > 0,
    }),
    teamPlace:
      liveEvent.teamPlace != null ? String(liveEvent.teamPlace) : base.teamPlace,
    teamRounds,
    teamTotal: playedTotal(teamRounds, liveEvent.teamTotal ?? base.teamTotal),
    teamToPar: parseToPar(liveEvent.teamToPar) ?? base.teamToPar,
    fieldTeams: liveEvent.teamStandings?.length || base.fieldTeams,
    scores,
    source: liveHasPosted ? "clippd" : liveHasLineup ? "clippd" : base.source,
    sourceLabel: liveHasPosted
      ? `Clippd scoreboard · ${formatScraped(scrapedAt)}`
      : liveHasLineup
        ? `Clippd lineup · ${formatScraped(scrapedAt)}`
        : base.sourceLabel,
    sourceUrl: liveHasPosted || liveHasLineup ? liveEvent.url || base.sourceUrl : base.sourceUrl,
    clippdUrl: liveEvent.url || base.clippdUrl || program.clippdSchedule,
    clippdTournamentId: liveEvent.tournamentId ?? base.clippdTournamentId,
    canceledRounds: flags.some(Boolean) ? flags : base.canceledRounds,
    note: cancelLabel
      ? [base.note, `${cancelLabel} cancelled — only completed rounds are scored.`]
          .filter(Boolean)
          .join(" ")
      : base.note,
  };
}

function findLiveMatch(
  event: Tournament,
  pool: LiveTournament[],
  used: Set<LiveTournament>,
): LiveTournament | null {
  const dated = pool.filter((l) => !used.has(l) && datesOverlap(event.dates, l.dates));
  const named = pool.filter((l) => !used.has(l) && l.name && namesMatch(event.name, l.name));
  const hit = dated.find((l) => named.includes(l)) || named[0] || dated[0] || null;
  return hit;
}

export function formatScraped(iso: string | null | undefined): string {
  if (!iso) return "Clippd";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Clippd";
  const hours = Math.max(0, Math.round((Date.now() - then) / 3_600_000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function liveEventsForTeam(
  team: LiveTeam | undefined,
  programDiv?: string | null,
): LiveTournament[] {
  if (!team) return [];
  const scheduled =
    team.schedule && team.schedule.length
      ? team.schedule
      : parseScheduleSnippet(team.scheduleSnippet);
  const pages = team.tournaments ?? [];
  const usedPages = new Set<LiveTournament>();
  const merged = scheduled.map((s) => {
    const page =
      pages.find((p) => {
        if (usedPages.has(p)) return false;
        if (s.tournamentId && p.tournamentId === s.tournamentId) return true;
        return Boolean(s.name && p.name && namesMatch(s.name, p.name));
      }) ?? null;
    if (page) usedPages.add(page);
    let over = overlayPage(s, page);
    if (page && isGarbageLive(page) && !(page.players?.length) && page.teamTotal == null) {
      over = {
        ...s,
        tournamentId: s.tournamentId || page.tournamentId,
        url: s.url || page.url,
        status: s.status || "upcoming",
      };
    }
    if (isGarbageLive(over) && !(over.players?.length) && over.teamTotal == null) {
      if (s.name && !/^SCOREBOARD$/i.test(s.name.trim())) {
        return {
          ...s,
          tournamentId: s.tournamentId || over.tournamentId,
          url: s.url || over.url,
          status: "upcoming",
        };
      }
      return null;
    }
    return over;
  });
  for (const page of pages) {
    if (usedPages.has(page)) continue;
    if (!page.name && !page.dates) continue;
    if (isGarbageLive(page) && !(page.players?.length) && page.teamTotal == null) continue;
    merged.push(page);
  }
  return merged.filter((e): e is LiveTournament => {
    if (e == null) return false;
    const division =
      e.division ||
      divisionFromSnippet(team.scheduleSnippet, e.name) ||
      null;
    if (division && !e.division) e.division = division;
    return eventMatchesProgramDivision(programDiv, division, e.name);
  });
}

function sortEvents(events: Tournament[]): Tournament[] {
  const rank = (e: Tournament) => {
    const start = parseEventRange(e.dates)?.start.getTime() ?? 0;
    if (e.status === "live") return [0, -start] as const;
    if (e.status === "complete" || e.status === "historical") return [1, -start] as const;
    return [2, start] as const;
  };
  return [...events].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra[0] !== rb[0]) return ra[0] - rb[0];
    return ra[1] - rb[1];
  });
}

export function findSharedLiveTeam(
  programId: string,
  clippdId?: string | null,
): LiveTeam | undefined {
  const teams = LIVE_RESULTS?.teams || {};
  if (teams[programId]) return teams[programId];
  if (!clippdId) return undefined;
  return Object.values(teams).find((t) => String(t.clippdId) === String(clippdId));
}

export function withLiveResults(
  program: Program,
  live: LiveResultsFile | null | undefined = LIVE_RESULTS,
): Program {
  const team = live?.teams?.[program.id];
  const scrapedAt = team?.scrapedAt || live?.scrapedAt || "";
  const liveEvents = liveEventsForTeam(team, program.div);
  const usedLive = new Set<LiveTournament>();
  const usedCurated = new Set<string>();
  const merged: Tournament[] = [];

  for (const curated of program.events) {
    const hit = findLiveMatch(curated, liveEvents, usedLive);
    if (hit) usedLive.add(hit);
    usedCurated.add(curated.id);
    merged.push(mergeOne(program, curated, hit, scrapedAt));
  }
  for (const leftover of liveEvents) {
    if (usedLive.has(leftover)) continue;
    merged.push(mergeOne(program, null, leftover, scrapedAt));
  }

  const seasonEvents = sortEvents(merged).filter((e) => isSeasonEvent(e.dates, e.name));
  const seasonIds = new Set(seasonEvents.map((e) => e.id));

  return {
    ...program,
    events: seasonEvents,
    insights: program.insights.filter((i) => !i.eventId || seasonIds.has(i.eventId)),
    clippdScrapedAt: scrapedAt || program.clippdScrapedAt,
  };
}

export function allProgramsLive(
  programs: Program[],
  live: LiveResultsFile | null | undefined = LIVE_RESULTS,
): Program[] {
  return programs.map((p) => withLiveResults(p, live));
}
