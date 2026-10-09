export interface ExtraTeamPin {
  id: string;
  name: string;
  div?: string;
  clippdId: string;
}

const OWNER = "anilrocks-commits";
const REPO = "zephyr-river-apex-flora";
const PATH = "public/data/extra-teams.json";
const BRANCH = "main";

function token() {
  return (
    process.env.WATCHLIST_GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    ""
  ).trim();
}

async function gh(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", `Bearer ${token()}`);
  headers.set("User-Agent", "arjun-golf-watchlist");
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  return fetch(`https://api.github.com${path}`, { ...init, headers });
}

function normalize(t: ExtraTeamPin): ExtraTeamPin | null {
  const clippdId = String(t.clippdId || "").trim();
  const id = String(t.id || "").trim();
  const name = String(t.name || "").trim();
  if (!/^\d+$/.test(clippdId) || !id || !name) return null;
  return { id, name, div: t.div || "D1", clippdId };
}

async function readExtraTeams(): Promise<{ teams: ExtraTeamPin[]; sha: string | null }> {
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`);
  if (res.status === 404) return { teams: [], sha: null };
  if (!res.ok) throw new Error(`GitHub read ${res.status}`);
  const data = (await res.json()) as { content?: string; sha?: string };
  const text = Buffer.from(String(data.content || ""), "base64").toString("utf8");
  const parsed = JSON.parse(text) as { teams?: ExtraTeamPin[] } | ExtraTeamPin[];
  const teams = Array.isArray(parsed) ? parsed : parsed.teams || [];
  return { teams, sha: data.sha || null };
}

async function writeTeams(teams: ExtraTeamPin[], sha: string | null, message: string) {
  const body = `${JSON.stringify({ teams }, null, 2)}\n`;
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(body).toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.status === 409) return "conflict" as const;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write ${res.status}: ${err.slice(0, 180)}`);
  }
  return "ok" as const;
}

async function dispatchScrape() {
  try {
    await gh(`/repos/${OWNER}/${REPO}/actions/workflows/scrape.clippd.yml/dispatches`, {
      method: "POST",
      body: JSON.stringify({ ref: BRANCH }),
    });
  } catch {
    /* 6am run still reads the file */
  }
}

export async function pinExtraTeams(
  incoming: ExtraTeamPin[],
): Promise<{ ok: boolean; added: number; reason?: string }> {
  if (!token()) return { ok: false, added: 0, reason: "no-token" };
  const clean = incoming.map(normalize).filter((t): t is ExtraTeamPin => Boolean(t));
  if (!clean.length) return { ok: true, added: 0 };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { teams, sha } = await readExtraTeams();
    const seen = new Set(teams.map((t) => String(t.clippdId)));
    const next = [...teams];
    let added = 0;
    for (const t of clean) {
      if (seen.has(t.clippdId)) continue;
      seen.add(t.clippdId);
      next.push(t);
      added += 1;
    }
    if (!added) return { ok: true, added: 0 };
    const wrote = await writeTeams(
      next,
      sha,
      `chore: pin ${clean.map((t) => t.name).join(", ")} on the daily scrape`,
    );
    if (wrote === "conflict") continue;
    await dispatchScrape();
    return { ok: true, added };
  }
  return { ok: false, added: 0, reason: "conflict" };
}

export async function unpinExtraTeams(
  incoming: { id?: string; clippdId?: string }[],
): Promise<{ ok: boolean; removed: number; reason?: string }> {
  if (!token()) return { ok: false, removed: 0, reason: "no-token" };
  const ids = new Set(incoming.map((t) => t.id).filter(Boolean) as string[]);
  const clips = new Set(incoming.map((t) => t.clippdId).filter(Boolean).map(String));
  if (!ids.size && !clips.size) return { ok: true, removed: 0 };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { teams, sha } = await readExtraTeams();
    const next = teams.filter((t) => !ids.has(t.id) && !clips.has(String(t.clippdId)));
    const removed = teams.length - next.length;
    if (!removed) return { ok: true, removed: 0 };
    const wrote = await writeTeams(
      next,
      sha,
      `chore: unpin ${[...ids, ...clips].join(", ")} from the daily scrape`,
    );
    if (wrote === "conflict") continue;
    return { ok: true, removed };
  }
  return { ok: false, removed: 0, reason: "conflict" };
}
