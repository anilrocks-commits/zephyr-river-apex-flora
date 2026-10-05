/**
 * Clippd lists any event a school has an entry in — including NAIA/NJCAA
 * side fields where a D1 team sent individuals. Those cards must not land
 * on an NCAA program schedule or they leak into selection / 2027 math.
 */

export type NcaaDiv = "D1" | "D2" | "D3";

const DIV_LINE =
  /^(NAIA|NJCAA|NCAA(?:\s+Division)?\s*(I{1,3}|1|2|3)|Division\s*(I{1,3}|1|2|3))$/i;

export function isDivisionLine(line: string): boolean {
  return DIV_LINE.test(String(line || "").trim());
}

export function normalizeEventDivision(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;
  if (/\bNAIA\b/i.test(s)) return "NAIA";
  if (/\bNJCAA\b|juco/i.test(s)) return "NJCAA";
  if (/division\s*(III|3)\b/i.test(s) || /\bD3\b/i.test(s)) return "NCAA Division III";
  if (/division\s*(II|2)\b/i.test(s) && !/III/i.test(s) || /\bD2\b/i.test(s))
    return "NCAA Division II";
  if (/division\s*(I|1)\b/i.test(s) || /\bD1\b/i.test(s)) return "NCAA Division I";
  if (isDivisionLine(s)) return s;
  return null;
}

export function eventMatchesProgramDivision(
  programDiv: string | null | undefined,
  eventDivision: string | null | undefined,
  eventName?: string | null,
): boolean {
  const eventDiv =
    normalizeEventDivision(eventDivision) ||
    normalizeEventDivision(eventName || "") ||
    null;
  if (!eventDiv) return true;
  const team = String(programDiv || "D1").toUpperCase();
  if (eventDiv === "NAIA" || eventDiv === "NJCAA") {
    return team === "NAIA" || team === "NJCAA";
  }
  if (eventDiv === "NCAA Division III") return team === "D3";
  if (eventDiv === "NCAA Division II") return team === "D2";
  if (eventDiv === "NCAA Division I") return team === "D1";
  return true;
}

/** Read division from a Clippd schedule snippet window after the event name. */
export function divisionFromSnippet(
  snippet: string | null | undefined,
  eventName: string | null | undefined,
): string | null {
  if (!snippet || !eventName) return null;
  const idx = snippet.toLowerCase().indexOf(eventName.toLowerCase());
  if (idx < 0) return null;
  const window = snippet.slice(idx, idx + 500);
  const m = window.match(/\b(NAIA|NJCAA|NCAA Division\s*I{1,3})\b/i);
  return m ? normalizeEventDivision(m[1]) : null;
}
