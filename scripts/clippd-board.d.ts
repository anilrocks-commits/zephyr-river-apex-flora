export function roundIsComplete(thru: string | number | null | undefined): boolean;

export interface ClippdBoardPlayer {
  name: string;
  school: string;
  role: "team" | "ind";
  rounds: number[];
  thru: string | null;
  total: number | null;
  toPar: number | null;
  finish: string | null;
}

export interface ClippdBoardTeam {
  school: string;
  rounds: number[];
  thru: string | null;
  total: number | null;
  toPar: number | null;
  finish: string | null;
}

export function parseClippdBoard(html: string): {
  par: number | null;
  players: ClippdBoardPlayer[];
  teams: ClippdBoardTeam[];
};
