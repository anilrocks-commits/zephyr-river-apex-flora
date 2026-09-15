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
