/** Decode HTML entities and curly quotes so names like Rhett O&#x27;Rear parse. */
export function decodeEntities(s: string): string {
  let text = String(s || "");
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    rsquo: "'",
    lsquo: "'",
    mdash: "—",
    ndash: "–",
  };
  for (let i = 0; i < 2; i += 1) {
    text = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, n: string) => {
      const key = n.toLowerCase();
      if (named[key]) return named[key];
      if (key.startsWith("#x")) return String.fromCharCode(parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCharCode(Number(key.slice(1)));
      return _;
    });
  }
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

const PLAYER_NAME_RE =
  /^[A-Z][A-Za-z.'’\u2019\-]+(?:\s+[A-Z][A-Za-z.'’\u2019\-]+)+$/;

export function isPlayerName(line: string): boolean {
  return PLAYER_NAME_RE.test(decodeEntities(line).trim());
}

/**
 * Clippd embeds per-round pars as totalPar:[72,72,71] (sometimes escaped
 * in the RSC payload). Unfinished nines show values like 55 — ignore those.
 */
export function parseCoursePar(html: string | null | undefined): number | null {
  if (!html) return null;
  const votes = new Map<number, number>();
  const re = /totalPar\\?":\[([0-9,]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const first = m[1]
      .split(",")
      .map((n) => parseInt(n, 10))
      .find((n) => n >= 67 && n <= 75);
    if (first) votes.set(first, (votes.get(first) || 0) + 1);
  }
  let best: number | null = null;
  let bestN = 0;
  for (const [par, n] of votes) {
    if (n > bestN) {
      best = par;
      bestN = n;
    }
  }
  if (best) return best;
  const tagged = html.match(/\bPAR:(\d{2})\b/);
  if (tagged) {
    const n = Number(tagged[1]);
    if (n >= 67 && n <= 75) return n;
  }
  return null;
}
