import { cn } from "@/lib/utils";
import { formatRound, formatToPar } from "@/lib/format";

export function ToPar({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  const tone =
    value == null
      ? "text-subtle"
      : value < 0
        ? "text-under"
        : value > 0
          ? "text-over"
          : "text-muted";
  return (
    <span className={cn("font-mono tabular-nums", tone, className)}>
      {formatToPar(value)}
    </span>
  );
}

export function RoundCell({
  score,
  par,
  counted,
  canceled,
}: {
  score: number | null | undefined;
  par: number;
  counted: boolean | null | undefined;
  canceled?: boolean;
}) {
  if (canceled) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-wide text-subtle" title="Round cancelled">
        CNCL
      </span>
    );
  }
  if (score == null) {
    return <span className="font-mono text-subtle">—</span>;
  }
  const rel = score - par;
  const tone = rel < 0 ? "text-under" : rel > 0 ? "text-over" : "text-fg";
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        tone,
        counted === false && "text-subtle/70 line-through decoration-muted",
      )}
      title={
        counted === false
          ? "Dropped from team score (5-count-4)"
          : counted
            ? "Counted toward team score"
            : undefined
      }
    >
      {formatRound(score)}
    </span>
  );
}
