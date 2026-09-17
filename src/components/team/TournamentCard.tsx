import { useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import type { Program, Tournament } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { RoundCell, ToPar } from "@/components/team/ScoreCells";
import { formatPlace } from "@/lib/format";
import { predictNextSquad, nextUpcomingEvent } from "@/lib/model";
import { cn } from "@/lib/utils";

const statusVariant: Record<string, "live" | "accent" | "default" | "warn"> = {
  complete: "accent",
  live: "live",
  upcoming: "default",
  historical: "warn",
};

export function TournamentCard({
  program,
  event,
  defaultOpen,
}: {
  program: Program;
  event: Tournament;
  defaultOpen?: boolean;
}) {
  const hasScores = event.scores.length > 0;
  const hasPostedRounds = event.scores.some((s) => s.rounds.some((r) => r != null));
  const [open, setOpen] = useState(Boolean(defaultOpen ?? (hasPostedRounds || event.status === "live")));
  const playerName = (id: string, fallback?: string) =>
    program.players.find((p) => p.id === id)?.name ?? fallback ?? id;
  const playerYear = (id: string) =>
    program.players.find((p) => p.id === id)?.year ?? "";
  const roundCount = Math.max(
    event.teamRounds.length,
    ...event.scores.map((s) => s.rounds.length),
    3,
  );
  const roundLabels = Array.from({ length: roundCount }, (_, i) => `R${i + 1}`);

  // Predicted squad only on the next upcoming event (and only when we have lineup history)
  const nextUp = nextUpcomingEvent(program);
  const isNextUpcoming = event.status === "upcoming" && nextUp?.id === event.id;
  const predicted = isNextUpcoming ? predictNextSquad(program) : null;

  return (
    <article className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-medium text-fg">{event.name}</h3>
            <Badge variant={statusVariant[event.status] ?? "default"}>{event.status}</Badge>
            {event.source === "clippd" ? <Badge variant="accent">Clippd</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted">
            {event.dates}
            <span className="mx-2 text-subtle">·</span>
            {event.venue}
            {event.fieldTeams ? (
              <>
                <span className="mx-2 text-subtle">·</span>
                {event.fieldTeams} teams
              </>
            ) : null}
          </p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <div className="font-display text-xl tabular-nums text-fg">
            {formatPlace(event.teamPlace)}
          </div>
          <ToPar value={event.teamToPar} className="text-xs" />
        </div>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-subtle transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <TeamLine event={event} roundLabels={roundLabels} />

          {event.lineupNote ? (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
              {event.lineupNote}
            </p>
          ) : null}

          {hasScores ? (
            <div className="-mx-4 mt-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-subtle">
                    <th className="px-3 py-2 font-medium">Player</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    {roundLabels.map((l) => (
                      <th key={l} className="px-3 py-2 font-medium">
                        {l}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium">To par</th>
                    <th className="px-3 py-2 font-medium">Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {event.scores.map((row) => (
                    <tr key={row.playerId} className="border-t border-border/80">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-fg">
                          {playerName(row.playerId, row.playerName)}
                        </div>
                        <div className="text-[11px] text-subtle">{playerYear(row.playerId)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <RoleChip role={row.role} />
                      </td>
                      {roundLabels.map((_, i) => (
                        <td key={i} className="px-3 py-2.5">
                          <RoundCell
                            score={row.rounds[i] ?? null}
                            par={event.par}
                            counted={row.counted[i]}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <ToPar value={row.toPar} />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted">
                        {row.finish ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : predicted ? (
            <PredictedSquadBlock predicted={predicted} />
          ) : (
            <p className="mt-4 rounded-lg bg-surface-2 px-3 py-3 text-sm text-muted">
              {event.status === "upcoming"
                ? "On the Clippd schedule. Lineup and round scores fill this card when the board posts them — nothing is invented."
                : "Team listing is on Clippd. Individual rounds are not on the latest scrape yet; the athletics recap is used when it has a confirmed card."}
            </p>
          )}

          {!hasPostedRounds && hasScores ? (
            <p className="mt-3 text-xs text-subtle">
              Lineup is confirmed. Round scores will fill in from Clippd / the official recap — struck
              scores, when present, are the 5-count-4 drop.
            </p>
          ) : null}

          {hasPostedRounds && event.scores.some((s) => s.counted.some((c) => c === false)) ? (
            <p className="mt-3 text-xs text-subtle">
              Struck scores were dropped from the team total (5-count-4).
            </p>
          ) : null}

          {event.note ? (
            <p className="mt-3 text-xs leading-relaxed text-subtle">{event.note}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
            <span>
              Source: {event.sourceLabel}{" "}
              <span className="text-subtle">({event.source})</span>
            </span>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              Recap <ExternalLink className="size-3" />
            </a>
            {event.clippdUrl ? (
              <a
                href={event.clippdUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                Clippd board <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function TeamLine({
  event,
  roundLabels,
}: {
  event: Tournament;
  roundLabels: string[];
}) {
  if (!event.teamRounds.length && !event.teamPlace) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {roundLabels.map((label, i) => (
        <Stat key={label} label={label} value={event.teamRounds[i] ?? "—"} />
      ))}
      <Stat label="Total" value={event.teamTotal ?? "—"} />
      <Stat label="To par" value={event.teamToPar != null ? event.teamToPar : "—"} par />
      <Stat label="Finish" value={event.teamPlace ?? "—"} />
    </div>
  );
}

function Stat({
  label,
  value,
  par,
}: {
  label: string;
  value: string | number;
  par?: boolean;
}) {
  const n = typeof value === "number" ? value : null;
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">{label}</div>
      {par && n != null ? (
        <ToPar value={n} className="text-base font-medium" />
      ) : (
        <div className="font-mono text-base tabular-nums text-fg">{value}</div>
      )}
    </div>
  );
}

function RoleChip({ role }: { role: string }) {
  if (role === "team") return <Badge variant="accent">Team</Badge>;
  if (role === "ind") return <Badge variant="warn">IND</Badge>;
  return <Badge>DNP</Badge>;
}

function PredictedSquadBlock({
  predicted,
}: {
  predicted: NonNullable<ReturnType<typeof predictNextSquad>>;
}) {
  const confLabel =
    predicted.confidence === "high"
      ? "High confidence"
      : predicted.confidence === "medium"
        ? "Medium confidence"
        : "Low confidence";

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface-2/60 px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-subtle">
          Predicted squad
        </span>
        <Badge variant="warn">{confLabel}</Badge>
        <span className="text-[11px] text-subtle">
          from first {predicted.eventsUsed} event{predicted.eventsUsed === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{predicted.note}</p>

      <div className="mt-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-subtle">
          Team (5-count-4)
        </div>
        <ul className="flex flex-col gap-1.5">
          {predicted.team.map((p, i) => (
            <li
              key={p.playerId}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm"
            >
              <span className="w-4 font-mono text-xs tabular-nums text-subtle">{i + 1}</span>
              <span className="min-w-[9rem] font-medium text-fg">{p.name}</span>
              <span className="text-[11px] text-subtle">{p.year}</span>
              <Badge variant="accent">Team</Badge>
              <span className="font-mono text-[11px] tabular-nums text-muted">
                sel {p.selectionScore}
              </span>
              <span className="text-[11px] text-subtle">{p.rationale}</span>
            </li>
          ))}
        </ul>
      </div>

      {predicted.individuals.length > 0 ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-subtle">
            Likely IND / bubble
          </div>
          <ul className="flex flex-col gap-1.5">
            {predicted.individuals.map((p) => (
              <li
                key={p.playerId}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm"
              >
                <span className="w-4" />
                <span className="min-w-[9rem] font-medium text-fg">{p.name}</span>
                <span className="text-[11px] text-subtle">{p.year}</span>
                <Badge variant="warn">IND</Badge>
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  sel {p.selectionScore}
                </span>
                <span className="text-[11px] text-subtle">{p.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
