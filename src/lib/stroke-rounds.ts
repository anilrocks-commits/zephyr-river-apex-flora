/** College events are 3 rounds, occasionally 4. Never 5. */
export const MAX_STROKE_ROUNDS = 4;

/**
 * Clippd prints round columns, then an empty slot, then a points number
 * that can look like a score (62, 88). Keep the prefix of stroke columns
 * that adds up to the player's total. That drops the points column whether
 * it landed in R4 or R5.
 */
export function trimStrokeRounds(
  rounds: Array<number | null | undefined>,
  total?: number | null,
  plannedRounds?: number | null,
): (number | null)[] {
  const clean = rounds.map((r) =>
    typeof r === "number" && Number.isFinite(r) ? r : null,
  );

  if (total != null && Number.isFinite(total) && total > 0) {
    let sum = 0;
    for (let i = 0; i < clean.length && i < MAX_STROKE_ROUNDS; i += 1) {
      if (clean[i] != null) sum += clean[i] as number;
      if (sum === total) return clean.slice(0, i + 1);
      if (sum > total) return dropTrailing(clean.slice(0, i));
    }
  }

  const cap =
    plannedRounds != null && plannedRounds >= 1 && plannedRounds <= MAX_STROKE_ROUNDS
      ? Math.round(plannedRounds)
      : MAX_STROKE_ROUNDS;
  const out: (number | null)[] = [];
  let strokes = 0;
  let gapped = false;
  for (const r of clean) {
    if (out.length >= cap) break;
    if (r == null) {
      if (strokes >= Math.min(3, cap)) gapped = true;
      out.push(null);
      continue;
    }
    if (gapped) break;
    out.push(r);
    strokes += 1;
  }
  return dropTrailing(out);
}

function dropTrailing(rows: (number | null)[]) {
  const out = [...rows];
  while (out.length && out[out.length - 1] == null) out.pop();
  return out;
}
