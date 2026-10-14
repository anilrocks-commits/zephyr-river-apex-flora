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

function sliceForward(text, start) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length && i < start + 100000; i += 1) {
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

function parseEnclosing(text, keyIdx, accept) {
  let from = keyIdx;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const start = text.lastIndexOf("{", from);
    if (start < 0) return null;
    const raw = sliceForward(text, start);
    if (raw && raw.length > keyIdx - start) {
      try {
        const obj = JSON.parse(raw);
        if (accept(obj)) return obj;
      } catch {
        /* try the parent brace */
      }
    }
    from = start - 1;
  }
  return null;
}

function extractLeaderboard(text) {
  const players = [];
  const teams = [];
  let i = 0;
  const playerKey = '"playerName":';
  while ((i = text.indexOf(playerKey, i)) !== -1) {
    const obj = parseEnclosing(
      text,
      i,
      (o) =>
        o.playerName &&
        Array.isArray(o.strokes) &&
        o.strokes.length > 0 &&
        o.strokes.length <= 4,
    );
    i += playerKey.length;
    if (obj) players.push(obj);
  }
  let j = 0;
  const schoolKey = '"schoolName":';
  while ((j = text.indexOf(schoolKey, j)) !== -1) {
    const obj = parseEnclosing(
      text,
      j,
      (o) =>
        o.schoolName &&
        !o.playerName &&
        Array.isArray(o.strokes) &&
        o.strokes.length > 0 &&
        o.strokes.length <= 4,
    );
    j += schoolKey.length;
    if (obj) teams.push(obj);
  }
  return { players, teams };
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

function saneToPar(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > 80) return null;
  return n;
}

function coursePar(text) {
  const m = text.match(/"totalPar":(6[7-9]|7[0-5])(?!\d)/);
  return m ? Number(m[1]) : null;
}

export function parseClippdBoard(html) {
  const text = unescapeFlight(html);
  const { players: playerObjs, teams: teamObjs } = extractLeaderboard(text);

  const playersById = new Map();
  const completeness = (obj) => {
    const rounds = Array.isArray(obj.rounds) ? obj.rounds : [];
    const done = rounds.filter((r) => roundIsComplete(r?.thru)).length;
    return (obj.strokes?.length || 0) * 10 + done;
  };
  for (const obj of playerObjs) {
    const id = String(obj.playerId || obj.playerName);
    const prev = playersById.get(id);
    if (!prev || completeness(obj) >= completeness(prev)) playersById.set(id, obj);
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
      toPar: saneToPar(obj.totalScore),
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
      toPar: saneToPar(obj.totalScore),
      finish: placeOf(obj.currentRank, teamRanks),
    };
  });

  return { par: coursePar(text), players, teams };
}
