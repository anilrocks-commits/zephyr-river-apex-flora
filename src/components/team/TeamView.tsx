import { useState } from "react";
import {
  ExternalLink,
  Flag,
  Star,
  Info,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Program } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/components/team/TournamentCard";
import { ToPar } from "@/components/team/ScoreCells";
import { allMetrics, detectMoves, openingForecast } from "@/lib/model";
import { isSeniorYear } from "@/lib/format";
import { formatScraped, withLiveResults } from "@/lib/live";
import { useIntelStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "tournaments", label: "Tournaments" },
  { id: "roster", label: "Roster" },
  { id: "selection", label: "Selection" },
  { id: "forecast", label: "2027 openings" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function TeamView({ program: rawProgram }: { program: Program }) {
  const program = withLiveResults(rawProgram);
  const [tab, setTab] = useState<TabId>("tournaments");
  const forecast = openingForecast(program);
  const metrics = allMetrics(program);
  const starred = useIntelStore((s) => s.starred);
  const toggleStar = useIntelStore((s) => s.toggleStar);
  const isStarred = starred.includes(program.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{program.div}</span>
            <span className="text-subtle">·</span>
            <span>{program.conf}</span>
            <span className="text-subtle">·</span>
            <span>{program.coach}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
            {program.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{program.intel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isStarred ? "default" : "secondary"}
            size="sm"
            onClick={() => toggleStar(program.id)}
          >
            <Star className={cn("size-3.5", isStarred && "fill-current")} />
            {isStarred ? "Watching" : "Watch"}
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href={program.clippd} target="_blank" rel="noreferrer">
              Clippd <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href={program.clippdSchedule} target="_blank" rel="noreferrer">
              Schedule <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href={program.rosterUrl} target="_blank" rel="noreferrer">
              Roster <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi label="Theoretical 2027 openings" value={forecast.theoretical} />
        <Kpi
          label="Practical range"
          value={forecast.rangeLabel}
          hint="Selection-weighted"
        />
        <Kpi
          label="Senior / 5th-year cohort"
          value={forecast.seniorCount == null ? "?" : String(forecast.seniorCount)}
        />
        <Kpi label="Turnover signal" value={forecast.turnover} small />
      </section>

      <p className="text-xs leading-relaxed text-subtle">{forecast.notes}</p>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
              tab === t.id
                ? "bg-surface-2 text-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tournaments" ? <Tournaments program={program} /> : null}
      {tab === "roster" ? <Roster program={program} metrics={metrics} /> : null}
      {tab === "selection" ? <Selection program={program} metrics={metrics} /> : null}
      {tab === "forecast" ? <Forecast program={program} metrics={metrics} /> : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  small,
}: {
  label: string;
  value: string;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">{label}</div>
      <div
        className={cn(
          "mt-1 font-display font-medium tabular-nums text-fg",
          small ? "text-lg leading-snug" : "text-2xl",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-[11px] text-muted">{hint}</div> : null}
    </div>
  );
}

function Tournaments({ program }: { program: Program }) {
  const liveCount = program.events.filter((e) => e.status === "live").length;
  const completeCount = program.events.filter(
    (e) => e.status === "complete" || e.status === "historical",
  ).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <p className="text-xs text-muted">
          {program.events.length} cards
          {liveCount ? ` · ${liveCount} live` : ""}
          {completeCount ? ` · ${completeCount} with results` : ""}
        </p>
        {program.clippdScrapedAt ? (
          <p className="text-[11px] text-subtle">
            Clippd schedule {formatScraped(program.clippdScrapedAt)}
          </p>
        ) : null}
      </div>
      {program.events.map((event, i) => (
        <TournamentCard
          key={event.id}
          program={program}
          event={event}
          defaultOpen={i === 0 || event.status === "live" || (event.status === "complete" && i < 3)}
        />
      ))}
    </div>
  );
}

function Roster({
  program,
  metrics,
}: {
  program: Program;
  metrics: ReturnType<typeof allMetrics>;
}) {
  const notes = useIntelStore((s) => s.notes);
  const setNote = useIntelStore((s) => s.setNote);

  if (program.rosterUnknown || program.players.length === 0) {
    return (
      <div className="rounded-xl bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-border)]">
        Roster reconciliation required. This is labeled Unknown rather than guessed.
      </div>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-subtle">
            <th className="px-3 py-2 font-medium">Player</th>
            <th className="px-3 py-2 font-medium">Year</th>
            <th className="px-3 py-2 font-medium">Hometown</th>
            <th className="px-3 py-2 font-medium">Starts</th>
            <th className="px-3 py-2 font-medium">Avg / rd</th>
            <th className="px-3 py-2 font-medium">Selection</th>
            <th className="px-3 py-2 font-medium">5th-year</th>
            <th className="px-3 py-2 font-medium">Signal</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.player.id} className="border-t border-border">
              <td className="px-3 py-3">
                <div className="font-medium text-fg">{m.player.name}</div>
                <input
                  value={notes[m.player.id] ?? ""}
                  onChange={(e) => setNote(m.player.id, e.target.value)}
                  placeholder="Private note"
                  className="mt-1 w-full rounded-md border border-transparent bg-transparent text-[11px] text-muted outline-none placeholder:text-subtle focus:border-border focus:bg-surface-2"
                />
              </td>
              <td className="px-3 py-3">
                <span
                  className={cn(
                    "font-medium",
                    isSeniorYear(m.player.year) ? "text-warn" : "text-muted",
                  )}
                >
                  {m.player.year}
                </span>
              </td>
              <td className="px-3 py-3 text-muted">{m.player.hometown}</td>
              <td className="px-3 py-3 font-mono text-xs text-muted">
                {m.teamStarts} team / {m.indStarts} IND
              </td>
              <td className="px-3 py-3">
                <ToPar value={m.avgToParPerRound} />
              </td>
              <td className="px-3 py-3">
                <ScoreBar value={m.selectionScore} />
              </td>
              <td className="px-3 py-3">
                {m.fifthYearProb == null ? (
                  <span className="text-subtle">—</span>
                ) : (
                  <span className="font-mono tabular-nums text-fg">{m.fifthYearProb}%</span>
                )}
              </td>
              <td className="max-w-48 px-3 py-3 text-xs text-muted">{m.player.signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted">{value}</span>
    </div>
  );
}

function shortLast(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 3 && /^(de|da|van|von|del)$/i.test(parts[parts.length - 2] ?? "")) {
    return parts.slice(-2).join(" ");
  }
  return parts[parts.length - 1] ?? name;
}

function Selection({
  program,
  metrics,
}: {
  program: Program;
  metrics: ReturnType<typeof allMetrics>;
}) {
  const moves = detectMoves(program).filter((m) => m.kind !== "held");
  const chartData = metrics
    .filter((m) => m.eventsPlayed > 0 || m.selectionScore > 0)
    .slice(0, 8)
    .map((m) => ({
      name: shortLast(m.player.name),
      score: m.selectionScore,
    }));

  return (
    <div className="flex flex-col gap-4">
      {program.insights.map((insight) => (
        <article
          key={insight.id}
          className={cn(
            "rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5",
            "border-l-2",
            insight.tone === "up" && "border-l-under",
            insight.tone === "down" && "border-l-over",
            insight.tone === "watch" && "border-l-warn",
            insight.tone === "info" && "border-l-accent",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-medium text-fg">{insight.title}</h3>
            <Badge
              variant={
                insight.confidence === "confirmed"
                  ? "accent"
                  : insight.confidence === "unknown"
                    ? "default"
                    : "warn"
              }
            >
              {insight.confidence}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{insight.body}</p>
          <p className="mt-2 text-xs text-subtle">{insight.evidence}</p>
        </article>
      ))}

      {moves.length > 0 ? (
        <section className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5">
          <h3 className="font-display text-base font-medium">Lineup moves</h3>
          <p className="mt-1 text-xs text-subtle">
            Detected from consecutive cards with published lineups. Held starters are omitted.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {moves.map((m, i) => (
              <li
                key={`${m.playerId}-${i}`}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm"
              >
                <MoveChip kind={m.kind} />
                <span className="font-medium text-fg">{m.name}</span>
                <span className="text-muted">
                  {m.from} → {m.to}
                </span>
                <span className="text-xs text-subtle">
                  {m.fromEvent} → {m.toEvent}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {chartData.length > 0 ? (
        <section className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5">
          <h3 className="font-display text-base font-medium">Selection score</h3>
          <p className="mt-1 text-xs text-subtle">
            Start rate, counted-round rate, scoring form, recency, IND penalty. Not a ranking of talent
            — a ranking of how much the coach is using the player.
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(232,238,233,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8b978f", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#8b978f", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1b2420",
                    border: "1px solid #24302a",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#e8eee9",
                  }}
                />
                <Bar dataKey="score" fill="#8fa894" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <p className="rounded-xl bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]">
          Selection scores appear after at least one published lineup.
        </p>
      )}
    </div>
  );
}

function MoveChip({ kind }: { kind: string }) {
  const map: Record<string, { label: string; variant: "accent" | "down" | "warn" | "live" | "default" }> =
    {
      promoted: { label: "Promoted", variant: "live" },
      relegated: { label: "Relegated", variant: "warn" },
      omitted: { label: "Omitted", variant: "down" },
      debut: { label: "Debut", variant: "accent" },
      held: { label: "Held", variant: "default" },
    };
  const m = map[kind] ?? { label: kind, variant: "default" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function Forecast({
  program,
  metrics,
}: {
  program: Program;
  metrics: ReturnType<typeof allMetrics>;
}) {
  const forecast = openingForecast(program);
  const seniors = metrics.filter((m) => isSeniorYear(m.player.year));

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface px-4 py-5 shadow-[var(--shadow-border)] sm:px-5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Flag className="size-3.5" />
          2027 recruiting math
        </div>
        <p className="mt-3 font-display text-3xl font-medium text-fg">
          {forecast.rangeLabel}
          <span className="ml-2 text-base text-muted">practical openings</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Theoretical ceiling {forecast.theoretical}. Senior count is not a scholarship forecast.
        </p>
        <p className="mt-2 text-xs text-subtle">{forecast.notes}</p>
      </section>

      {seniors.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]">
          {program.rosterUnknown
            ? "No senior cohort until the roster is reconciled."
            : "No seniors on the current snapshot."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {seniors.map((m) => (
            <article
              key={m.player.id}
              className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium text-fg">
                  {m.player.name}{" "}
                  <span className="text-xs font-normal text-warn">{m.player.year}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{m.fifthYearLabel}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">
                    5th-year prob
                  </div>
                  <div className="font-mono text-lg tabular-nums text-fg">
                    {m.fifthYearProb == null ? "—" : `${m.fifthYearProb}%`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">
                    Vacate?
                  </div>
                  <div className={m.likelyVacates ? "text-under" : "text-warn"}>
                    {m.likelyVacates ? "Likely opens" : "Contested"}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Confirmed means visible in Clippd or an official recap. Inferred is a recruiting read from
        that evidence. Unknown means we will not fill the gap. No 5th-year decision is treated as
        confirmed until a roster change or an explicit program/player confirmation.
      </p>
    </div>
  );
}
