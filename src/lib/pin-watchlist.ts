import type { Program } from "@/data/types";

export function syncWatchlist(body: {
  teams?: Pick<Program, "id" | "name" | "div" | "clippdTeamId">[];
  remove?: { id?: string; clippdId?: string | null }[];
}) {
  const teams = (body.teams || [])
    .filter((t) => t.clippdTeamId)
    .map((t) => ({
      id: t.id,
      name: t.name,
      div: t.div,
      clippdId: t.clippdTeamId as string,
    }));
  const remove = (body.remove || []).filter((t) => t.id || t.clippdId);
  if (!teams.length && !remove.length) return;
  void fetch("/api/watchlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ teams, remove }),
  }).catch(() => undefined);
}
