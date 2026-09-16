import { Link } from "@tanstack/react-router";
import { PROGRAMS } from "@/data/programs";
import { openingForecast, opportunityScore, allMetrics } from "@/lib/model";
import { allProgramsLive, formatScraped } from "@/lib/live";
import { Badge } from "@/components/ui/badge";

export function Watchlist() {
  const programs = allProgramsLive(PROGRAMS);
  const ranked = [...programs].sort(
    (a, b) => opportunityScore(b) - opportunityScore(a),
  );
  const live = programs.filter((p) => p.events.some((e) => e.status === "live"));
  const scrapedAt = programs.find((p) => p.clippdScrapedAt)?.clippdScrapedAt;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16">
      <header>
        <p className="text-xs uppercase tracking-[0.16em] text-subtle">2027 class</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight text-fg">
          Watch list
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Ten programs, scored by likely 2027 openings — not by how many seniors are on the
          roster. Open a school to read tournament scorecards, lineup moves, and 5th-year
          probability. Clippd is the live source; athletics recaps fill gaps and are labeled.
        </p>
        {scrapedAt ? (
          <p className="mt-2 text-[11px] text-subtle">
            Clippd schedule {formatScraped(scrapedAt)}
          </p>
        ) : null}
      </header>

      {live.length > 0 ? (
        <section>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
            Live this week
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {live.map((p) => {
              const event = p.events.find((e) => e.status === "live");
              return (
                <Link
                  key={p.id}
                  to="/team/$id"
                  params={{ id: p.id }}
                  className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-fg">{p.short}</span>
                    <Badge variant="live">Live</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{event?.name}</p>
                  <p className="mt-1 text-xs text-subtle">{event?.venue}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        {ranked.map((p) => {
          const f = openingForecast(p);
          const metrics = allMetrics(p);
          const liveEvent = p.events.find((e) => e.status === "live");
          const lastComplete = p.events.find(
            (e) => e.status === "complete" || e.status === "historical",
          );
          const vacate = p.events.some((e) => e.scores.length > 0)
            ? metrics.filter((m) => m.likelyVacates).length
            : null;
          const topInsight = p.insights[0];
          return (
            <Link
              key={p.id}
              to="/team/$id"
              params={{ id: p.id }}
              className="flex flex-col rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-medium text-fg">{p.name}</h2>
                    <Badge variant={p.div === "D3" ? "default" : "accent"}>{p.div}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {p.conf}
                    <span className="mx-2 text-subtle">·</span>
                    {p.coach}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl tabular-nums text-fg">
                    {f.rangeLabel}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-subtle">
                    openings
                  </div>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {topInsight?.title ?? p.intel}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-subtle">
                {liveEvent ? (
                  <span className="text-under">Live · {liveEvent.name}</span>
                ) : lastComplete ? (
                  <span>
                    Last card · {lastComplete.name}
                    {lastComplete.teamPlace ? ` · ${lastComplete.teamPlace}` : ""}
                  </span>
                ) : (
                  <span>Awaiting first fall card</span>
                )}
                <span className="ml-auto font-mono tabular-nums">
                  {vacate == null ? "Awaiting lineups" : `${vacate} likely vacate`}
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
