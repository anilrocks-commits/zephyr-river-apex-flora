#!/usr/bin/env node
/**
 * Clippd men's team rankings: current season and the season before it.
 * Rank 100000 means the team has not played enough rounds to be ranked.
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "data", "rankings.json");
const API = "https://scoreboard.clippd.com/api/rankings/leaderboard";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const DIVISIONS = [
  { key: "D1", label: "NCAA Division I", query: "NCAA Division I" },
  { key: "D3", label: "NCAA Division III", query: "NCAA Division III" },
];

function realRank(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n >= 1000) return null;
  return n;
}

async function fetchBoard(division, season) {
  const url = new URL(API);
  url.searchParams.set("rankingType", "Team");
  url.searchParams.set("gender", "Men");
  url.searchParams.set("division", division);
  url.searchParams.set("sortField", "rank");
  url.searchParams.set("season", String(season));
  url.searchParams.set("limit", "400");
  url.searchParams.set("offset", "0");
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = await res.json();
  const rows = Array.isArray(data.results) ? data.results : [];
  if (rows.length < 50) throw new Error(`thin board ${division} ${season}: ${rows.length}`);
  return rows;
}

async function main() {
  const divisions = {};
  for (const div of DIVISIONS) {
    const currentSeason = 2027;
    const previousSeason = 2026;
    console.log(`→ ${div.label}`);
    const [current, previous] = await Promise.all([
      fetchBoard(div.query, currentSeason),
      fetchBoard(div.query, previousSeason),
    ]);
    const byId = new Map();
    for (const row of previous) {
      byId.set(String(row.schoolId), {
        id: String(row.schoolId),
        name: row.boardName || row.schoolName,
        school: row.schoolName || row.boardName,
        current: null,
        previous: realRank(row.rank),
      });
    }
    let asOf = null;
    let previousAsOf = null;
    for (const row of previous) {
      if (row.rankingDate) previousAsOf = row.rankingDate;
    }
    for (const row of current) {
      const id = String(row.schoolId);
      const prev = byId.get(id);
      if (row.rankingDate) asOf = row.rankingDate;
      byId.set(id, {
        id,
        name: row.boardName || prev?.name || row.schoolName,
        school: row.schoolName || prev?.school || row.boardName,
        current: realRank(row.rank),
        previous: prev?.previous ?? null,
      });
    }
    const teams = [...byId.values()].sort((a, b) => {
      const ar = a.current ?? a.previous ?? 9999;
      const br = b.current ?? b.previous ?? 9999;
      return ar - br;
    });
    const ranked = teams.filter((t) => t.current != null).length;
    console.log(`  current ${ranked} ranked / ${current.length}  previous rows ${previous.length}`);
    divisions[div.key] = {
      label: div.label,
      currentSeason: String(currentSeason),
      previousSeason: String(previousSeason),
      asOf,
      previousAsOf,
      teams,
    };
  }

  mkdirSync(dirname(OUT), { recursive: true });
  const payload = {
    scrapedAt: new Date().toISOString(),
    source: "https://scoreboard.clippd.com/rankings/leaderboard",
    divisions,
  };
  writeFileSync(OUT, JSON.stringify(payload));
  console.log(`wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
