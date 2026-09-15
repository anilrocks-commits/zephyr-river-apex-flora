export type Division = "D1" | "D3";
export type Year = "Fr" | "So" | "Jr" | "R-Jr" | "Sr" | "5th" | "Gr";
export type Role = "team" | "ind" | "dnp";
export type EventStatus = "complete" | "live" | "upcoming" | "historical";
export type Confidence = "confirmed" | "inferred" | "unknown";
export type InsightTone = "up" | "down" | "watch" | "info";
export type SourceKind = "clippd" | "athletics" | "inferred";

export interface Player {
  id: string;
  name: string;
  year: Year;
  hometown: string;
  signal: string;
}

export interface PlayerRound {
  playerId: string;
  role: Role;
  rounds: (number | null)[];
  toPar: number | null;
  finish: string | null;
  counted: (boolean | null)[];
}

export interface Tournament {
  id: string;
  name: string;
  dates: string;
  venue: string;
  par: number;
  fieldTeams: number | null;
  fieldPlayers: number | null;
  status: EventStatus;
  teamPlace: string | null;
  teamRounds: (number | null)[];
  teamTotal: number | null;
  teamToPar: number | null;
  scores: PlayerRound[];
  source: SourceKind;
  sourceLabel: string;
  sourceUrl: string;
  clippdUrl?: string;
  note?: string;
  lineupNote?: string;
}

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  evidence: string;
  confidence: Confidence;
  playerIds: string[];
  eventId?: string;
}

export interface Program {
  id: string;
  name: string;
  short: string;
  div: Division;
  conf: string;
  coach: string;
  clippd: string;
  clippdSchedule: string;
  rosterUrl: string;
  seniors: number | null;
  intel: string;
  players: Player[];
  events: Tournament[];
  insights: Insight[];
  rosterUnknown?: boolean;
}
