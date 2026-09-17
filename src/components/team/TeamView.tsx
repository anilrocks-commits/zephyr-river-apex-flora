import { useState } from "react";
import {
  ExternalLink,
  Flag,
  Star,
  Info,
  ChevronDown,
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
import {
  allMetrics,
  detectMoves,
  openingForecast,
  nextUpcomingEvent,
} from "@/lib/model";
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
      {(() => {
        const nextUpId = nextUpcomingEvent(program)?.id;
        return program.events.map((event, i) => (
          <TournamentCard
            key={event.id}
            program={program}
            event={event}
            defaultOpen={
              i === 0 ||
              event.status === "live" ||
              (event.status === "complete" && i < 3) ||
              event.id === nextUpId
            }
          />
        ));
      })()}
    </div>
  );
}

function playerEventRows(program: Program, playerId: string) {
  return program.events
    .filter((e) => e.status === "complete" || e.status === "live" || e.status === "historical")
    .map((e) => {
      const row = e.scores.find((s) => s.playerId === playerId);
      if (!row || row.role === "dnp") return null;
      if (!row.rounds.some((r) => r != null)) return null;
      return { event: e, row };
    })
    .filter(Boolean) as {
    event: Program["events"][number];
    row: Program["events"][number]["scores"][number];
  }[];
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
  const [openId, setOpenId] = useState<string | null>(null);

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
            <th className="px-3 py-2 font-medium w-6" />
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
          {metrics.map((m) => {
            const cards = playerEventRows(program, m.player.id);
            const open = openId === m.player.id;
            return (
              <RosterPlayerBlock
                key={m.player.id}
                m={m}
                cards={cards}
                open={open}
                onToggle={() => setOpenId(open ? null : m.player.id)}
                note={notes[m.player.id] ?? ""}
                onNote={(v) => setNote(m.player.id, v)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RosterPlayerBlock({
  m,
  cards,
  open,
  onToggle,
  note,
  onNote,
}: {
  m: ReturnType<typeof allMetrics>[number];
  cards: ReturnType<typeof playerEventRows>;
  open: boolean;
  onToggle: () => void;
  note: string;
  onNote: (v: string) => void;
}) {
  return (
    <>
      <tr className="border-t border-border">
        <td className="px-2 py-3">
          <button
            type="button"
            onClick={onToggle}
            disabled={cards.length === 0}
            className={cn(
              "flex size-7 items-center justify-center rounded-md text-subtle transition-colors",
              cards.length ? "hover:bg-surface-2 hover:text-fg" : "opacity-30",
            )}
            aria-label={open ? "Hide tournament scores" : "Show tournament scores"}
          >
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="font-medium text-fg">{m.player.name}</div>
          <input
            value={note}
            onChange={(e) => onNote(e.target.value)}
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
      {open && cards.length > 0 ? (
        <tr className="bg-surface-2/40">
          <td colSpan={9} className="px-4 py-3">
            <div className="ml-6 flex flex-col gap-2 border-l border-border pl-4">
              <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">
                Tournament scores
              </div>
              {cards.map(({ event, row }) => (
                <div
                  key={event.id}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs"
                >
                  <span className="min-w-[10rem] font-medium text-fg">{event.name}</span>
                  <span className="text-subtle">{event.dates}</span>
                  <span className="text-muted">
                    {row.role === "ind" ? "IND" : "Team"}
                    {row.finish ? ` · ${row.finish}` : ""}
                  </span>
                  <span className="font-mono tabular-nums text-muted">
                    {row.rounds
                      .filter((r) => r != null)
                      .map((r, i) => `R${i + 1} ${r}`)
                      .join("  ·  ")}
                  </span>
                  <ToPar value={row.toPar} className="text-xs" />
                </div>
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
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
      <section className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
          <div>
            <h3 className="font-display text-base font-medium">2027 openings model</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{forecast.notes}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">Theoretical</div>
            <div className="font-mono text-lg text-fg">{forecast.theoretical}</div>
          </div>
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">Practical</div>
            <div className="font-mono text-lg text-fg">{forecast.rangeLabel}</div>
          </div>
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">Likely vacate</div>
            <div className="font-mono text-lg text-fg">
              {forecast.likely == null ? "—" : forecast.likely}
            </div>
          </div>
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">Confidence</div>
            <div className="font-mono text-lg text-fg">{forecast.confidence}</div>
          </div>
        </div>
      </section>

      {seniors.length > 0 ? (
        <section className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] sm:px-5">
          <h3 className="font-display text-base font-medium">Senior / 5th-year cohort</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {seniors.map((m) => (
              <li
                key={m.player.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="min-w-[9rem] font-medium text-fg">{m.player.name}</span>
                <span className="text-subtle">{m.player.year}</span>
                <span className="font-mono text-xs text-muted">sel {m.selectionScore}</span>
                {m.fifthYearProb != null ? (
                  <span className="font-mono text-xs text-fg">{m.fifthYearProb}% return</span>
                ) : null}
                <span className="text-xs text-subtle">{m.fifthYearLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-xl bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]">
          No seniors flagged on this roster snapshot.
        </p>
      )}
    </div>
  );
}
