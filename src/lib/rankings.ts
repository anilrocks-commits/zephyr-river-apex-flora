import type { Division, Program } from "@/data/types";
import raw from "../../public/data/rankings.json" with { type: "json" };

export interface RankingTeam {
  id: string;
  name: string;
  school: string;
  current: number | null;
  previous: number | null;
}

export interface RankingDivision {
  label: string;
  currentSeason: string;
  previousSeason: string;
  asOf?: string | null;
  previousAsOf?: string | null;
  teams: RankingTeam[];
}

export interface RankingsFile {
  scrapedAt: string;
  source?: string;
  divisions: Partial<Record<Division, RankingDivision>>;
}

export interface TeamRanking {
  division: Division;
  divisionLabel: string;
  current: number | null;
  previous: number | null;
  /** Positive means the team moved up (a smaller rank number). */
  delta: number | null;
  currentSeason: string;
  previousSeason: string;
  asOf: string | null;
  sourceUrl: string;
  previousSourceUrl: string;
}

const ALIASES: Record<string, string[]> = {
  umhb: ["mary hardin-baylor", "university of mary hardin-baylor"],
};

const DROP = new Set(["university", "college", "of", "the"]);

function core(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token && !DROP.has(token));
}

function sameName(a: string, b: string): boolean {
  const left = core(a);
  const right = core(b);
  return left.length > 0 && left.length === right.length && left.every((token, i) => token === right[i]);
}

function seasonSpan(season: string): string {
  const year = Number(season);
  if (!Number.isFinite(year)) return season;
  return `${year - 1}/${String(year).slice(2)}`;
}

function clippdId(program: Pick<Program, "clippd" | "clippdTeamId">): string | null {
  return program.clippdTeamId || program.clippd.match(/teams\/(\d+)/)?.[1] || null;
}

function candidateNames(program: Pick<Program, "id" | "name" | "short">): string[] {
  return [program.name, program.short, ...(ALIASES[program.id] || [])].filter(Boolean);
}

export function lookupRanking(
  program: Pick<Program, "id" | "name" | "short" | "div" | "clippd" | "clippdTeamId">,
  file: RankingsFile,
): TeamRanking | null {
  const board = file.divisions[program.div];
  if (!board) return null;
  const id = clippdId(program);
  let row = id ? board.teams.find((team) => team.id === id) : undefined;
  if (!row) {
    const names = candidateNames(program);
    const hits = board.teams.filter((team) =>
      names.some((name) => sameName(name, team.name) || sameName(name, team.school)),
    );
    if (hits.length === 1) row = hits[0];
  }
  if (!row) return null;
  const current = row.current;
  const previous = row.previous;
  const divisionQuery = board.label.replace(/ /g, "+");
  const base = `https://scoreboard.clippd.com/rankings/leaderboard?rankingType=Team&gender=Men&division=${divisionQuery}`;
  return {
    division: program.div,
    divisionLabel: program.div === "D3" ? "NCAA D3" : "NCAA D1",
    current,
    previous,
    delta: current != null && previous != null ? previous - current : null,
    currentSeason: seasonSpan(board.currentSeason),
    previousSeason: seasonSpan(board.previousSeason),
    asOf: board.asOf || null,
    sourceUrl: base,
    previousSourceUrl: `${base}&season=${board.previousSeason}`,
  };
}

export function teamRanking(
  program: Pick<Program, "id" | "name" | "short" | "div" | "clippd" | "clippdTeamId">,
): TeamRanking | null {
  return lookupRanking(program, raw as RankingsFile);
}
