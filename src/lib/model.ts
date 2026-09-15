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
