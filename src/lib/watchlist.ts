import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/data/types";
import { withCommits } from "@/lib/commits";
import { findSharedLiveTeam, withLiveResults, type LiveTeam } from "@/lib/live";
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

function newerLive(a?: LiveTeam, b?: LiveTeam): LiveTeam | undefined {
  if (!a) return b;
  if (!b) return a;
  const ta = Date.parse(a.scrapedAt || "") || 0;
  const tb = Date.parse(b.scrapedAt || "") || 0;
  return ta >= tb ? a : b;
}

export function hydrateProgram(
  program: Program,
  customLive: Record<string, LiveTeam> = {},
): Program {
  const local = program.custom ? customLive[program.id] : undefined;
  const shared = program.custom
    ? findSharedLiveTeam(program.id, clippdIdOf(program))
    : undefined;
  const live = newerLive(shared, local);
  if (program.custom && live) {
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
