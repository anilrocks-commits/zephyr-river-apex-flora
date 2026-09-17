import type { Player, PlayerRound, Program, Tournament } from "@/data/types";
import { isSeniorYear } from "@/lib/format";

export interface PlayerMetrics {
  player: Player;
  eventsPlayed: number;
  teamStarts: number;
  indStarts: number;
  dnpEvents: number;
  startRate: number;
  countedRounds: number;
  teamRounds: number;
  countedRate: number;
  avgToParPerRound: number | null;
  lastRole: "team" | "ind" | "dnp" | "none";
  selectionScore: number;
  fifthYearProb: number | null;
  fifthYearLabel: string;
  likelyVacates: boolean;
}

export interface OpeningForecast {
  theoretical: string;
  seniorCount: number | null;
  likely: number | null;
  possible: number | null;
  rangeLabel: string;
  turnover: string;
  confidence: "confirmed" | "inferred" | "unknown";
  notes: string;
}

export interface LineupMove {
  playerId: string;
  name: string;
  from: string;
  to: string;
  kind: "promoted" | "relegated" | "omitted" | "held" | "debut";
  fromEvent: string;
  toEvent: string;
}

function completedEvents(program: Program): Tournament[] {
  return program.events.filter(
    (e) => e.status === "complete" || e.status === "historical" || e.status === "live",
  );
}

function eventsWithLineup(program: Program): Tournament[] {
  return program.events.filter((e) => e.scores.length > 0);
}

export function playerMetrics(program: Program, player: Player): PlayerMetrics {
  const events = eventsWithLineup(program);
  const scoredEvents = events.filter((e) =>
    e.scores.some((s) => s.playerId === player.id && s.role !== "dnp"),
  );
  let teamStarts = 0;
  let indStarts = 0;
  let countedRounds = 0;
  let teamRounds = 0;
  let toParSum = 0;
  let roundCount = 0;
  let lastRole: PlayerMetrics["lastRole"] = "none";

  for (const event of events) {
    const row = event.scores.find((s) => s.playerId === player.id);
    if (!row) {
      lastRole = "dnp";
      continue;
    }
    lastRole = row.role;
    if (row.role === "team") teamStarts += 1;
    if (row.role === "ind") indStarts += 1;
    if (row.role === "team") {
      for (let i = 0; i < row.rounds.length; i++) {
        if (row.rounds[i] != null) {
          teamRounds += 1;
          if (row.counted[i]) countedRounds += 1;
        }
      }
    }
    for (const r of row.rounds) {
      if (r != null && event.par) {
        toParSum += r - event.par;
        roundCount += 1;
      }
    }
  }

  const available = Math.max(events.length, 1);
  const startRate = teamStarts / available;
  const countedRate = teamRounds > 0 ? countedRounds / teamRounds : 0;
  const avgToParPerRound = roundCount > 0 ? toParSum / roundCount : null;

  let form = 50;
  if (avgToParPerRound != null) {
    form = Math.max(0, Math.min(100, 62 - avgToParPerRound * 8));
  }

  const recency =
    lastRole === "team" ? 100 : lastRole === "ind" ? 40 : lastRole === "dnp" ? 10 : 50;
  const indPenalty = events.length ? 1 - indStarts / available : 1;

  const selectionScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        startRate * 38 + countedRate * 18 + form * 0.22 + recency * 0.14 + indPenalty * 8,
      ),
    ),
  );

  let fifthYearProb: number | null = null;
  let fifthYearLabel = "Not in the 2027 eligibility window";
  if (player.year === "5th" || player.year === "Gr") {
    fifthYearProb = 12;
    fifthYearLabel = "Already in extra year — likely gone unless confirmed return";
  } else if (player.year === "Sr") {
    let p = 32 + selectionScore * 0.38;
    if (lastRole === "ind") p -= 18;
    if (lastRole === "dnp") p -= 28;
    if (startRate < 0.4 && events.length > 0) p -= 12;
    if (countedRate < 0.4 && teamRounds > 0) p -= 10;
    fifthYearProb = Math.round(Math.max(8, Math.min(82, p)));
    fifthYearLabel =
      fifthYearProb >= 55
        ? "Trusted scoring-five senior — higher return risk"
        : fifthYearProb >= 35
          ? "Unsettled — watch next two lineups"
          : "Low return probability on current selection";
  } else if (player.year === "Jr" || player.year === "R-Jr") {
    fifthYearProb = null;
    fifthYearLabel = "2028 window";
  }

  return {
    player,
    eventsPlayed: scoredEvents.length,
    teamStarts,
    indStarts,
    dnpEvents: Math.max(0, events.length - scoredEvents.length),
    startRate,
    countedRounds,
    teamRounds,
    countedRate,
    avgToParPerRound,
    lastRole,
    selectionScore,
    fifthYearProb,
    fifthYearLabel,
    likelyVacates:
      (player.year === "Sr" && (fifthYearProb ?? 100) < 45) ||
      player.year === "5th" ||
      player.year === "Gr",
  };
}

export function allMetrics(program: Program): PlayerMetrics[] {
  return program.players
    .map((p) => playerMetrics(program, p))
    .sort((a, b) => b.selectionScore - a.selectionScore);
}

export function openingForecast(program: Program): OpeningForecast {
  if (program.rosterUnknown || program.seniors === null) {
    return {
      theoretical: "Unknown",
      seniorCount: null,
      likely: null,
      possible: null,
      rangeLabel: "Unknown",
      turnover: "Roster unreconciled",
      confidence: "unknown",
      notes:
        "No opening range is published until Clippd and the official roster agree on the senior / 5th-year cohort.",
    };
  }

  const metrics = allMetrics(program);
  const seniors = metrics.filter((m) => isSeniorYear(m.player.year));
  const likely = seniors.filter((m) => m.likelyVacates).length;
  const possible = seniors.filter((m) => (m.fifthYearProb ?? 100) < 65).length;
  const theoretical = `0–${program.seniors}`;
  const hasLineups = eventsWithLineup(program).length > 0;

  let turnover = "Low theoretical turnover";
  if (program.seniors >= 5) turnover = "High theoretical pool";
  else if (program.seniors >= 2) turnover = "Moderate theoretical pool";

  return {
    theoretical,
    seniorCount: program.seniors,
    likely: hasLineups ? likely : null,
    possible: hasLineups ? possible : null,
    rangeLabel: hasLineups ? `${likely}–${program.seniors}` : theoretical,
    turnover,
    confidence: hasLineups ? "inferred" : "inferred",
    notes: hasLineups
      ? "Practical range weights coach selection, not senior count. A senior repeatedly outside the scoring five is treated as more likely to vacate."
      : "Senior count is the theoretical ceiling only. Fall lineups will narrow the practical range.",
  };
}

export function detectMoves(program: Program): LineupMove[] {
  const events = eventsWithLineup(program).filter(
    (e) => e.status === "complete" || e.status === "live" || e.status === "historical",
  );
  if (events.length < 2) return [];
  const moves: LineupMove[] = [];
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const next = events[i];
    const ids = new Set([
      ...prev.scores.map((s) => s.playerId),
      ...next.scores.map((s) => s.playerId),
    ]);
    for (const id of ids) {
      const player = program.players.find((p) => p.id === id);
      if (!player) continue;
      const a = prev.scores.find((s) => s.playerId === id)?.role ?? "dnp";
      const b = next.scores.find((s) => s.playerId === id)?.role ?? "dnp";
      if (a === b) {
        if (a === "team") {
          moves.push({
            playerId: id,
            name: player.name,
            from: a,
            to: b,
            kind: "held",
            fromEvent: prev.name,
            toEvent: next.name,
          });
        }
        continue;
      }
      let kind: LineupMove["kind"] = "held";
      if (a === "dnp" && b === "team") kind = "debut";
      else if ((a === "ind" || a === "dnp") && b === "team") kind = "promoted";
      else if (a === "team" && b === "ind") kind = "relegated";
      else if ((a === "team" || a === "ind") && b === "dnp") kind = "omitted";
      else if (a === "dnp" && b === "ind") kind = "debut";
      moves.push({
        playerId: id,
        name: player.name,
        from: a,
        to: b,
        kind,
        fromEvent: prev.name,
        toEvent: next.name,
      });
    }
  }
  return moves.filter((m) => m.kind !== "held" || events.length <= 2);
}

export function opportunityScore(program: Program): number {
  const f = openingForecast(program);
  if (f.seniorCount == null) return 15;
  const likely = f.likely ?? Math.min(1, f.seniorCount);
  const evidence = eventsWithLineup(program).length > 0 ? 12 : 0;
  return Math.min(100, likely * 22 + f.seniorCount * 6 + evidence);
}

export function teamFive(event: Tournament): PlayerRound[] {
  return event.scores.filter((s) => s.role === "team");
}

export function individuals(event: Tournament): PlayerRound[] {
  return event.scores.filter((s) => s.role === "ind");
}

export interface PredictedPlayer {
  playerId: string;
  name: string;
  year: string;
  role: "team" | "ind";
  selectionScore: number;
  /** Short reason: e.g. "2/2 team starts · +1.2/rd" */
  rationale: string;
  teamStarts: number;
  avgToParPerRound: number | null;
  lastRole: PlayerMetrics["lastRole"];
}

export interface PredictedSquad {
  team: PredictedPlayer[];
  individuals: PredictedPlayer[];
  /** How many completed lineups informed the prediction */
  eventsUsed: number;
  confidence: "low" | "medium" | "high";
  note: string;
}

/**
 * Predict the traveling team (top 5) + likely IND slots for the next event
 * from selection scores and performance across the first completed lineups.
 * College default: 5-count-4 team; IND when selection trails the five.
 */
export function predictNextSquad(program: Program, teamSize = 5): PredictedSquad | null {
  if (program.rosterUnknown || program.players.length === 0) return null;

  const lineupEvents = eventsWithLineup(program).filter(
    (e) => e.status === "complete" || e.status === "live" || e.status === "historical",
  );
  // Prefer chronological order (earliest first) so "first two events" are the season openers
  const ordered = [...lineupEvents].sort((a, b) => {
    const sa = a.dates || "";
    const sb = b.dates || "";
    return sa.localeCompare(sb);
  });
  const window = ordered.slice(0, Math.max(2, ordered.length));
  const eventsUsed = window.length;

  if (eventsUsed === 0) {
    // No posted lineups yet — rank by year alone is too weak; skip prediction
    return null;
  }

  const metrics = allMetrics(program);

  // Re-score with extra weight on the early-season window (first two events)
  const ranked = metrics.map((m) => {
    let windowTeam = 0;
    let windowToPar = 0;
    let windowRounds = 0;
    for (const e of window) {
      const row = e.scores.find((s) => s.playerId === m.player.id);
      if (!row || row.role === "dnp") continue;
      if (row.role === "team") windowTeam += 1;
      for (const r of row.rounds) {
        if (r != null && e.par) {
          windowToPar += r - e.par;
          windowRounds += 1;
        }
      }
    }
    const windowStartRate = windowTeam / Math.max(eventsUsed, 1);
    const windowForm =
      windowRounds > 0
        ? Math.max(0, Math.min(100, 62 - (windowToPar / windowRounds) * 8))
        : 50;
    // Blend: selectionScore already encodes full history; boost early consistency
    const predictScore = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          m.selectionScore * 0.55 +
            windowStartRate * 32 +
            windowForm * 0.13 +
            (m.lastRole === "team" ? 8 : m.lastRole === "ind" ? 2 : 0),
        ),
      ),
    );

    const formLabel =
      m.avgToParPerRound == null
        ? "no rounds"
        : `${m.avgToParPerRound > 0 ? "+" : ""}${m.avgToParPerRound.toFixed(1)}/rd`;
    const startLabel =
      eventsUsed === 1
        ? m.teamStarts
          ? "team start"
          : m.indStarts
            ? "IND"
            : "DNP"
        : `${m.teamStarts}/${eventsUsed} team`;

    return {
      m,
      predictScore,
      windowTeam,
      rationale: `${startLabel} · ${formLabel}`,
    };
  });

  ranked.sort((a, b) => b.predictScore - a.predictScore);

  const team = ranked.slice(0, teamSize).map((r) => ({
    playerId: r.m.player.id,
    name: r.m.player.name,
    year: r.m.player.year,
    role: "team" as const,
    selectionScore: r.predictScore,
    rationale: r.rationale,
    teamStarts: r.m.teamStarts,
    avgToParPerRound: r.m.avgToParPerRound,
    lastRole: r.m.lastRole,
  }));

  const teamIds = new Set(team.map((t) => t.playerId));
  const individuals = ranked
    .filter((r) => !teamIds.has(r.m.player.id))
    .filter((r) => r.m.indStarts > 0 || r.m.selectionScore >= 35)
    .slice(0, 3)
    .map((r) => ({
      playerId: r.m.player.id,
      name: r.m.player.name,
      year: r.m.player.year,
      role: "ind" as const,
      selectionScore: r.predictScore,
      rationale: r.rationale,
      teamStarts: r.m.teamStarts,
      avgToParPerRound: r.m.avgToParPerRound,
      lastRole: r.m.lastRole,
    }));

  const confidence: PredictedSquad["confidence"] =
    eventsUsed >= 2 && metrics.some((m) => m.teamStarts >= 2)
      ? "high"
      : eventsUsed >= 1
        ? "medium"
        : "low";

  const note =
    eventsUsed >= 2
      ? `Based on selection + form across the first ${eventsUsed} posted lineups. Top ${teamSize} by predicted selection; not a coach announcement.`
      : `Based on the only posted lineup so far. Confidence rises after a second event.`;

  return { team, individuals, eventsUsed, confidence, note };
}

const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse tournament date strings like "Sep 21 - Sep 22, 2026" → start ms */
function eventStartMs(dates: string | null | undefined): number {
  if (!dates) return Number.POSITIVE_INFINITY;
  const m = dates
    .trim()
    .match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:\s*[-–]\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{1,2}))?,\s*(\d{4})$/i,
    );
  if (!m) return Number.POSITIVE_INFINITY;
  const year = Number(m[5]);
  const month = MONTH_IDX[m[1].slice(0, 3).toLowerCase()];
  const day = Number(m[2]);
  if (month == null || !year || !day) return Number.POSITIVE_INFINITY;
  return new Date(year, month, day).getTime();
}

/** Next upcoming event by real calendar start (not string sort). */
export function nextUpcomingEvent(program: Program): Tournament | null {
  const upcoming = program.events.filter((e) => e.status === "upcoming");
  if (!upcoming.length) return null;
  return (
    [...upcoming].sort((a, b) => eventStartMs(a.dates) - eventStartMs(b.dates))[0] ??
    null
  );
}
