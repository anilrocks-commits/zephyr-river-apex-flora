import type {
  EventStatus,
  Player,
  PlayerRound,
  Program,
  Role,
  Tournament,
} from "@/data/types";
import rawLive from "../../public/data/live-results.json";

export interface LivePlayerScore {
  name: string;
  rounds: number[];
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
  teamRounds?: number[];
  players?: LivePlayerScore[];
  teamStandings?: { place?: string; team?: string }[];
  error?: string | null;
  rawSnippet?: string | null;
  scoreboardLive?: boolean;
  city?: string | null;
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
  /^(NCAA|NAIA|Men|Women|Division|Conference|Head Coach|Ranking|Roster|Schedule|Season|Home|Tournaments|News|Live Streams|Coach Portal|In Partnership|INFORMATION|National|Load more|ScoreboardLive)$/i;

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
  const m = dates.trim().match(DATE_LINE);
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

export function eventStatusFromDates(
  dates: string,
  hasScores: boolean,
  today = new Date(),
): EventStatus {
  const range = parseEventRange(dates);
  if (!range) return hasScores ? "complete" : "upcoming";
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (day < range.start) return "upcoming";
  if (day > range.end) return hasScores ? "complete" : "historical";
  return "live";
}

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b\d+(st|nd|rd|th)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NOISE_WORDS.has(t));
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
    let j = i + 2;
    while (j < lines.length && !DATE_LINE.test(lines[j])) {
      const t = lines[j];
      if (t.toLowerCase() === "scoreboardlive") scoreboardLive = true;
      else if (SKIP_LINE.test(t) || /\((Men|Women)\)$/i.test(t)) {
        /* nav / division chrome */
      } else extras.push(t);
      j += 1;
    }
    events.push({
      name,
      dates,
      city: extras[0] ?? null,
      venue: extras[1] ?? extras[0] ?? null,
      scoreboardLive,
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
  const venue = snippet.match(/Venue:\s*\n([^\n]+)/i)?.[1]?.trim() ?? null;
  const dates = snippet.match(/Dates?:\s*\n([^\n]+)/i)?.[1]?.trim() ?? null;
  return { venue, dates };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function matchPlayer(players: Player[], name: string): Player | undefined {
  const n = nameTokens(name).join(" ");
  const exact = players.find((p) => nameTokens(p.name).join(" ") === n);
  if (exact) return exact;
  const last = nameTokens(name).at(-1);
  if (!last) return undefined;
  const lasts = players.filter((p) => nameTokens(p.name).at(-1) === last);
  return lasts.length === 1 ? lasts[0] : undefined;
}

function liveScoresToRows(program: Program, live: LiveTournament): PlayerRound[] {
  const players = live.players ?? [];
  const rows: PlayerRound[] = players.map((p) => {
    const matched = matchPlayer(program.players, p.name);
    const role: Role = p.role === "ind" ? "ind" : p.role === "dnp" ? "dnp" : "team";
    const rounds = (p.rounds ?? []).map((r) => (Number.isFinite(r) ? r : null));
    return {
      playerId: matched?.id ?? `clippd:${slug(p.name)}`,
      playerName: p.name,
      role,
      rounds,
      toPar: parseToPar(p.toPar),
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
      .filter((e): e is { i: number; v: number } => e.v != null);
    if (entries.length < 5) {
      for (const e of entries) next[e.i].counted[r] = true;
      continue;
    }
    const worst = [...entries].sort((a, b) => b.v - a.v)[0];
    for (const e of entries) next[e.i].counted[r] = e.i !== worst.i;
  }
  return next;
}

function hasPostedScores(event: Pick<Tournament, "scores" | "teamPlace" | "teamTotal">): boolean {
  if (event.teamPlace || event.teamTotal != null) return true;
  return event.scores.some((s) => s.rounds.some((r) => r != null));
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
  const scores = liveScoresToRows(program, live);
  const dates = live.dates || "TBA";
  const hasScores = scores.some((s) => s.rounds.some((r) => r != null)) || live.teamTotal != null;
  const id = live.tournamentId
    ? `${program.id}-clippd-${live.tournamentId}`
    : `${program.id}-${slug(live.name || dates)}`;
  return {
    id,
    name: live.name || "Unnamed tournament",
    dates,
    venue: formatVenue(live),
    par: 72,
    fieldTeams: live.teamStandings?.length || null,
    fieldPlayers: null,
    status: eventStatusFromDates(dates, hasScores),
    teamPlace: live.teamPlace != null ? String(live.teamPlace) : null,
    teamRounds: live.teamRounds ?? [],
    teamTotal: live.teamTotal ?? null,
    teamToPar: parseToPar(live.teamToPar),
    scores,
    source: "clippd",
    sourceLabel: hasScores
      ? `Clippd scoreboard · ${formatScraped(scrapedAt)}`
      : "Clippd schedule",
    sourceUrl: live.url || program.clippdSchedule,
    clippdUrl: live.url || program.clippdSchedule,
    clippdTournamentId: live.tournamentId ?? undefined,
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
  const liveEvent = live as LiveTournament;
  const base = curated as Tournament;
  const liveRows = liveScoresToRows(program, liveEvent);
  const liveHasScores =
    liveRows.some((s) => s.rounds.some((r) => r != null)) || liveEvent.teamTotal != null;
  const scores = liveHasScores ? liveRows : base.scores;
  const dates = liveEvent.dates || base.dates;
  const hasScores = hasPostedScores({ ...base, scores, teamPlace: liveEvent.teamPlace != null ? String(liveEvent.teamPlace) : base.teamPlace, teamTotal: liveEvent.teamTotal ?? base.teamTotal });
  return {
    ...base,
    name: base.name,
    dates,
    venue: base.venue || formatVenue(liveEvent),
    status: eventStatusFromDates(dates, hasScores),
    teamPlace:
      liveEvent.teamPlace != null ? String(liveEvent.teamPlace) : base.teamPlace,
    teamRounds: liveEvent.teamRounds?.length ? liveEvent.teamRounds : base.teamRounds,
    teamTotal: liveEvent.teamTotal ?? base.teamTotal,
    teamToPar: parseToPar(liveEvent.teamToPar) ?? base.teamToPar,
    fieldTeams: liveEvent.teamStandings?.length || base.fieldTeams,
    scores,
    source: liveHasScores ? "clippd" : base.source,
    sourceLabel: liveHasScores
      ? `Clippd scoreboard · ${formatScraped(scrapedAt)}`
      : base.sourceLabel,
    sourceUrl: liveHasScores ? liveEvent.url || base.sourceUrl : base.sourceUrl,
    clippdUrl: liveEvent.url || base.clippdUrl || program.clippdSchedule,
    clippdTournamentId: liveEvent.tournamentId ?? base.clippdTournamentId,
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

export function liveEventsForTeam(team: LiveTeam | undefined): LiveTournament[] {
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
    return overlayPage(s, page);
  });
  for (const page of pages) {
    if (usedPages.has(page)) continue;
    if (!page.name && !page.dates) continue;
    merged.push(page);
  }
  return merged;
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

export function withLiveResults(
  program: Program,
  live: LiveResultsFile | null | undefined = LIVE_RESULTS,
): Program {
  const team = live?.teams?.[program.id];
  const scrapedAt = team?.scrapedAt || live?.scrapedAt || "";
  const liveEvents = liveEventsForTeam(team);
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

  return {
    ...program,
    events: sortEvents(merged),
    clippdScrapedAt: scrapedAt || program.clippdScrapedAt,
  };
}

export function allProgramsLive(
  programs: Program[],
  live: LiveResultsFile | null | undefined = LIVE_RESULTS,
): Program[] {
  return programs.map((p) => withLiveResults(p, live));
}
