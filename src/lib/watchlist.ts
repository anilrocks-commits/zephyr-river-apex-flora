import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/data/types";
import { withCommits } from "@/lib/commits";
import { withLiveResults, type LiveTeam } from "@/lib/live";
import { useIntelStore } from "@/lib/store";

function clippdIdOf(p: Program): string | null {
  return p.clippdTeamId || p.clippd.match(/teams\/(\d+)/)?.[1] || null;
}

export function mergeWatchlist(builtIn: Program[], custom: Program[]): Program[] {
  const ids = new Set(builtIn.map((p) => p.id));
  const clippd = new Set(builtIn.map(clippdIdOf).filter(Boolean) as string[]);
  const extras = custom.filter((p) => !ids.has(p.id) && !clippd.has(clippdIdOf(p) || ""));
  return [...builtIn, ...extras];
}

export function hydrateProgram(
  program: Program,
  customLive: Record<string, LiveTeam> = {},
): Program {
  if (program.custom && customLive[program.id]) {
    const live = customLive[program.id];
    return withCommits(
      withLiveResults(program, {
        scrapedAt: live.scrapedAt || "",
        teams: { [program.id]: live },
      }),
    );
  }
  return withCommits(withLiveResults(program));
}

export function useWatchlist(): Program[] {
  const custom = useIntelStore((s) => s.customPrograms);
  const customLive = useIntelStore((s) => s.customLive);
  return mergeWatchlist(PROGRAMS, custom).map((p) => hydrateProgram(p, customLive));
}

export function useRawProgram(id: string): Program | undefined {
  const custom = useIntelStore((s) => s.customPrograms);
  return mergeWatchlist(PROGRAMS, custom).find((p) => p.id === id);
}

export function useProgram(id: string): Program | undefined {
  const customLive = useIntelStore((s) => s.customLive);
  const raw = useRawProgram(id);
  return raw ? hydrateProgram(raw, customLive) : undefined;
}
