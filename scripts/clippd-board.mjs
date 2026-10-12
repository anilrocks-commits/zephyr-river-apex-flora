/**
 * Read Clippd's embedded leaderboard instead of the flattened columns.
 * A live row is: total strokes, hole through, then one number per round.
 * The total is not a round. A round still on the course is marked with thru.
 */
// @ts-nocheck

function unescapeFlight(html) {
  return String(html || "")
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, "&")
    .replace(/\\u0027/g, "'");
}

function sliceObject(text, keyIdx) {
  const start = text.lastIndexOf("{", keyIdx);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length && i < start + 80000; i += 1) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function extractByKey(text, key) {
  const needle = `"${key}":`;
  const out = [];
  const seen = new Set();
  let i = 0;
  while ((i = text.indexOf(needle, i)) !== -1) {
    const raw = sliceObject(text, i);
    i += needle.length;
    if (!raw) continue;
    const sig = `${raw.length}:${raw.slice(0, 48)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    try {
      out.push(JSON.parse(raw));
    } catch {
      /* a nested fragment that isn't standalone JSON */
    }
  }
  return out;
}

export function roundIsComplete(thru) {
  if (thru == null || thru === "") return true;
  const s = String(thru).trim();
  return /^f$/i.test(s) || s === "18";
}

function placeOf(rank, ranks) {
  const n = Number(rank);
  if (!Number.isFinite(n) || n <= 0) return null;
  const tied = ranks.filter((r) => Number(r) === n).length > 1;
  return `${tied ? "T" : ""}${n}`;
}

function roundThru(obj) {
  const list = Array.isArray(obj.rounds) ? obj.rounds.map((r) => r?.thru) : [];
  const strokes = Array.isArray(obj.strokes) ? obj.strokes : [];
  let thru = null;
  const rounds = [];
  for (let i = 0; i < strokes.length && i < 4; i += 1) {
    const n = Number(strokes[i]);
    if (!Number.isFinite(n) || n <= 0) {
      rounds.push(null);
      continue;
    }
    const hole = list[i] != null ? String(list[i]) : null;
    if (hole && !roundIsComplete(hole)) thru = hole;
    rounds.push(n);
  }
  while (rounds.length && rounds[rounds.length - 1] == null) rounds.pop();
  return { rounds, thru };
}

function coursePar(text) {
  const m = text.match(/"totalPar":(6[7-9]|7[0-5])(?!\d)/);
  return m ? Number(m[1]) : null;
}

export function parseClippdBoard(html) {
  const text = unescapeFlight(html);
  const objects = extractByKey(text, "strokes");
  const playerObjs = [];
  const teamObjs = [];
  for (const obj of objects) {
    if (!Array.isArray(obj.strokes) || obj.strokes.length === 0 || obj.strokes.length > 4) continue;
    if (obj.playerName && obj.schoolName) playerObjs.push(obj);
    else if (obj.schoolName && !obj.playerName) teamObjs.push(obj);
  }

  const playersById = new Map();
  for (const obj of playerObjs) {
    const id = String(obj.playerId || obj.playerName);
    const prev = playersById.get(id);
    if (!prev || (obj.strokes?.length || 0) >= (prev.strokes?.length || 0)) playersById.set(id, obj);
  }
  const uniquePlayers = [...playersById.values()];
  const playerRanks = uniquePlayers.map((p) => p.currentRank);
  const players = uniquePlayers.map((obj) => {
    const { rounds, thru } = roundThru(obj);
    return {
      name: String(obj.playerName),
      school: String(obj.schoolName),
      role: String(obj.teamLabel || "").toUpperCase() === "IND" ? "ind" : "team",
      rounds,
      thru,
      total: Number.isFinite(Number(obj.totalStrokes)) ? Number(obj.totalStrokes) : null,
      toPar: Number.isFinite(Number(obj.totalScore)) ? Number(obj.totalScore) : null,
      finish: placeOf(obj.currentRank, playerRanks),
    };
  });

  const teamsBySchool = new Map();
  for (const obj of teamObjs) {
    const id = String(obj.schoolId || obj.schoolName);
    teamsBySchool.set(id, obj);
  }
  const uniqueTeams = [...teamsBySchool.values()];
  const teamRanks = uniqueTeams.map((t) => t.currentRank);
  const teams = uniqueTeams.map((obj) => {
    const { rounds, thru } = roundThru(obj);
    return {
      school: String(obj.schoolName),
      rounds,
      thru,
      total: Number.isFinite(Number(obj.totalStrokes)) ? Number(obj.totalStrokes) : null,
      toPar: Number.isFinite(Number(obj.totalScore)) ? Number(obj.totalScore) : null,
      finish: placeOf(obj.currentRank, teamRanks),
    };
  });

  return { par: coursePar(text), players, teams };
}
