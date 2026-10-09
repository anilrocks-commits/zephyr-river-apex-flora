/**
 * Single roster of watchlist programs for the daily scrapers.
 * Built-in schools live in TEAMS. Colleges added from the webapp are
 * pinned into public/data/extra-teams.json and merged here.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TEAMS = [
  {
    id: "siu",
    name: "Southern Illinois",
    div: "D1",
    clippdId: "4127",
    rosterUrl: "https://siusalukis.com/sports/mens-golf/roster",
    aliases: ["southern illinois", "siu", "southern illinois university", "southern illinois salukis"],
  },
  {
    id: "ksu",
    name: "Kennesaw State",
    div: "D1",
    clippdId: "4172",
    rosterUrl: "https://ksuowls.com/sports/mens-golf/roster",
    aliases: ["kennesaw state", "kennesaw state university", "ksu"],
  },
  {
    id: "shu",
    name: "Seton Hall",
    div: "D1",
    clippdId: "3163",
    rosterUrl: "https://shupirates.com/sports/mens-golf/roster",
    aliases: ["seton hall", "seton hall university"],
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara",
    div: "D1",
    clippdId: "2520",
    rosterUrl: "https://ucsbgauchos.com/sports/mens-golf/roster",
    aliases: ["uc santa barbara", "ucsb", "california santa barbara", "santa barbara gauchos"],
  },
  {
    id: "memphis",
    name: "Memphis",
    div: "D1",
    clippdId: "3916",
    rosterUrl: "https://gotigersgo.com/sports/mgolf/roster",
    aliases: ["memphis", "university of memphis", "memphis tigers"],
  },
  {
    id: "howard",
    name: "Howard",
    div: "D1",
    rosterUrl: "https://hubison.com/sports/mgolf/roster",
    aliases: ["howard", "howard university", "howard bison"],
  },
  {
    id: "man",
    name: "Manhattan",
    div: "D1",
    clippdId: "3652",
    rosterUrl: "https://gojaspers.com/sports/mens-golf/roster",
    aliases: ["manhattan", "manhattan university", "manhattan college", "manhattan jaspers"],
  },
  {
    id: "fdu",
    name: "Fairleigh Dickinson",
    div: "D1",
    rosterUrl: "https://fduknights.com/sports/mens-golf/roster",
    aliases: ["fairleigh dickinson", "fdu", "fairleigh dickinson university"],
  },
  {
    id: "umhb",
    name: "UMHB",
    div: "D3",
    rosterUrl: "https://cruathletics.com/sports/mens-golf/roster",
    aliases: ["umhb", "mary hardin baylor", "university of mary hardin baylor", "mary hardin-baylor"],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    div: "D3",
    clippdId: "2457",
    rosterUrl: "https://uofrathletics.com/sports/mens-golf/roster",
    aliases: ["university of rochester", "rochester", "rochester yellowjackets"],
  },
  {
    id: "cmu",
    name: "Carnegie Mellon",
    div: "D3",
    rosterUrl: "https://athletics.cmu.edu/sports/mgolf/roster",
    aliases: ["carnegie mellon", "carnegie mellon university", "cmu"],
  },
];

export const CLIPPD_TEAMS = TEAMS.filter((t) => t.clippdId);

export function mergeTeams(base, extra) {
  const seen = new Set(base.map((t) => t.clippdId).filter(Boolean).map(String));
  const ids = new Set(base.map((t) => t.id));
  const merged = [...base];
  for (const t of extra || []) {
    if (!t?.clippdId || !t?.name || !t?.id) continue;
    const clippdId = String(t.clippdId);
    const id = String(t.id);
    if (seen.has(clippdId) || ids.has(id)) continue;
    seen.add(clippdId);
    ids.add(id);
    merged.push({
      id,
      name: String(t.name),
      div: t.div === "D3" ? "D3" : t.div === "D2" ? "D2" : "D1",
      clippdId,
      rosterUrl: t.rosterUrl || `https://scoreboard.clippd.com/teams/${clippdId}/roster`,
      aliases:
        Array.isArray(t.aliases) && t.aliases.length
          ? t.aliases.map((a) => String(a).toLowerCase())
          : [String(t.name).toLowerCase()],
    });
  }
  return merged;
}

export function loadExtraTeams() {
  try {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "../public/data/extra-teams.json"), "utf8"),
    );
    const list = Array.isArray(raw) ? raw : raw.teams || [];
    return list;
  } catch {
    return [];
  }
}

export function loadTeams() {
  return mergeTeams(TEAMS, loadExtraTeams());
}
