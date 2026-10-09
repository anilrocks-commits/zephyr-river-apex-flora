/** Keep in sync with src/lib/stroke-rounds.ts */
export const MAX_STROKE_ROUNDS = 4;

export function trimStrokeRounds(rounds, total, plannedRounds) {
  const clean = (rounds || []).map((r) =>
    typeof r === "number" && Number.isFinite(r) ? r : null,
  );

  if (total != null && Number.isFinite(total) && total > 0) {
    let sum = 0;
    for (let i = 0; i < clean.length && i < MAX_STROKE_ROUNDS; i += 1) {
      if (clean[i] != null) sum += clean[i];
      if (sum === total) return clean.slice(0, i + 1);
      if (sum > total) return dropTrailing(clean.slice(0, i));
    }
  }

  const cap =
    plannedRounds != null && plannedRounds >= 1 && plannedRounds <= MAX_STROKE_ROUNDS
      ? Math.round(plannedRounds)
      : MAX_STROKE_ROUNDS;
  const out = [];
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

function dropTrailing(rows) {
  const out = [...rows];
  while (out.length && out[out.length - 1] == null) out.pop();
  return out;
}
