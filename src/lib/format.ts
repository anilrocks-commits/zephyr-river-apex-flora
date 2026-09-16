export function formatToPar(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatRound(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return String(n);
}

export function formatPlace(place: string | null | undefined): string {
  if (!place) return "—";
  return place;
}

export function yearLabel(year: string): string {
  if (year === "5th") return "5th year";
  if (year === "R-Jr") return "R-Jr";
  return year;
}

export function isSeniorYear(year: string): boolean {
  return year === "Sr" || year === "5th" || year === "Gr";
}

export function sourceLabel(kind: string): string {
  if (kind === "clippd") return "Clippd";
  if (kind === "athletics") return "Athletics recap";
  return "Inferred";
}

export function formatScrapedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const hours = Math.max(0, Math.round((Date.now() - then) / 3_600_000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
