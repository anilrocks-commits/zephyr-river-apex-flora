import { defineEventHandler, readBody, createError } from "h3";
import { importCollegeFromClippd, parseClippdTeamId } from "../../src/lib/clippd-import.server";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    input?: string;
    takenIds?: string[];
    takenClippdIds?: string[];
    refresh?: boolean;
  } | null;
  const input = String(body?.input || "").trim();
  if (!parseClippdTeamId(input)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Paste a Clippd team URL or id, like https://scoreboard.clippd.com/teams/3916",
    });
  }
  try {
    const imported = await importCollegeFromClippd(
      input,
      body?.takenIds || [],
      body?.refresh ? [] : body?.takenClippdIds || [],
    );
    return imported;
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: err instanceof Error ? err.message : "Clippd import failed",
    });
  }
});
