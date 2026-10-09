import { defineEventHandler, readBody } from "h3";
import { pinExtraTeams, unpinExtraTeams, type ExtraTeamPin } from "../../src/lib/extra-teams.server";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    teams?: ExtraTeamPin[];
    remove?: { id?: string; clippdId?: string }[];
  } | null;
  try {
    const pinned = body?.teams?.length
      ? await pinExtraTeams(body.teams)
      : { ok: true, added: 0 };
    const removed = body?.remove?.length
      ? await unpinExtraTeams(body.remove)
      : { ok: true, removed: 0 };
    return { pinned, removed };
  } catch (err) {
    return {
      pinned: { ok: false, added: 0, reason: err instanceof Error ? err.message : "pin failed" },
      removed: { ok: false, removed: 0 },
    };
  }
});
