import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/model")({ component: ModelPage });

function ModelPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-2xl pb-16">
        <p className="text-xs uppercase tracking-[0.16em] text-subtle">Method</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight">
          Selection model
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Senior count is a ceiling. A 2027 opening is a seat the coach stops filling with a
          current player. This monitor scores that the same way a coach fills a five-man card:
          who started, who counted, who beat teammates, and who was just moved.
        </p>

        <h2 className="mt-10 font-display text-xl">Source hierarchy</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            <span className="text-fg">Clippd / Scoreboard</span> — roster, schedule, lineup and
            results when published.
          </li>
          <li>
            <span className="text-fg">Official athletics recap</span> — reconciliation and
            lineup announcements. Never overrides Clippd scoring when both exist.
          </li>
          <li>
            <span className="text-fg">Inference</span> — always labeled. Never presented as a
            confirmed 5th-year decision.
          </li>
        </ol>

        <h2 className="mt-10 font-display text-xl">Selection score (0–100)</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>Start rate in the scoring five — 38%</li>
          <li>Counted-round rate in 5-count-4 — 18%</li>
          <li>Scoring form (to-par per round) — 22%</li>
          <li>Recency of last role (team / IND / DNP) — 14%</li>
          <li>IND penalty — 8%</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Struck scores on a card are the dropped round. A player who is in the five but never
          counts is already losing the seat.
        </p>

        <h2 className="mt-10 font-display text-xl">5th-year probability</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Seniors start around 32% and move with selection score. IND or DNP in the latest card
          cuts the number. A 5th-year already used is treated as likely gone. Juniors are left
          unlabeled — they are the 2028 window. Nothing in this column is confirmed until the
          roster or the player says so.
        </p>

        <h2 className="mt-10 font-display text-xl">Practical openings</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Likely vacate = seniors / 5th-years with 5th-year probability under 45%, plus anyone
          already in extra eligibility. The published range is that count through the raw senior
          total. Six seniors is a pool. Two of them never counting is the actual class.
        </p>
      </article>
    </AppShell>
  );
}
