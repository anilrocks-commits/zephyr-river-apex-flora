import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { openingForecast } from "@/lib/model";
import { syncWatchlist } from "@/lib/pin-watchlist";
import { useWatchlist } from "@/lib/watchlist";
import { Badge } from "@/components/ui/badge";
import { useIntelStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Program } from "@/data/types";

export function ProgramNav({
  activeId,
  onNavigate,
}: {
  activeId?: string;
  onNavigate?: () => void;
}) {
  const starred = useIntelStore((s) => s.starred);
  const navOrder = useIntelStore((s) => s.navOrder);
  const hiddenIds = useIntelStore((s) => s.hiddenIds);
  const setNavOrder = useIntelStore((s) => s.setNavOrder);
  const hideProgram = useIntelStore((s) => s.hideProgram);
  const restoreProgram = useIntelStore((s) => s.restoreProgram);
  const removeCustomProgram = useIntelStore((s) => s.removeCustomProgram);
  const hydrated = useIntelStore((s) => s.hasHydrated);
  const customPrograms = useIntelStore((s) => s.customPrograms);
  const programs = useWatchlist();
  const [editing, setEditing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const teams = customPrograms.filter((p) => p.clippdTeamId);
    if (!teams.length) return;
    const key = teams
      .map((t) => t.clippdTeamId)
      .sort()
      .join(",");
    try {
      if (sessionStorage.getItem("arjun-watchlist-pin") === key) return;
      sessionStorage.setItem("arjun-watchlist-pin", key);
    } catch {
      /* ignore */
    }
    syncWatchlist({ teams });
  }, [hydrated, customPrograms]);

  const byId = new Map(programs.map((p) => [p.id, p]));
  const hidden = hiddenIds.map((id) => byId.get(id)).filter((p): p is Program => Boolean(p));
  const visible = orderedVisible(programs, navOrder, hiddenIds);

  function move(id: string, dir: -1 | 1) {
    const ids = visible.map((p) => p.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    setNavOrder(next);
  }

  function remove(program: Program) {
    if (program.custom) {
      removeCustomProgram(program.id);
      syncWatchlist({ remove: [{ id: program.id, clippdId: program.clippdTeamId }] });
      return;
    }
    hideProgram(program.id);
  }

  const grouped = navOrder.length === 0;
  const d1 = visible.filter((p) => p.div !== "D3");
  const d3 = visible.filter((p) => p.div === "D3");

  return (
    <nav className="flex flex-col gap-1 px-2 pb-8">
      <div className="flex items-center justify-between px-3 pt-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
          Programs
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-md px-2 py-1 text-[11px] text-muted hover:bg-surface-2 hover:text-fg"
        >
          {editing ? "Done" : "Edit list"}
        </button>
      </div>
      {grouped ? (
        <>
          <Group label="Division I">
            {d1.map((p) => (
              <NavItem
                key={p.id}
                program={p}
                active={activeId === p.id}
                starred={starred.includes(p.id)}
                editing={editing}
                canUp={visible[0]?.id !== p.id}
                canDown={visible[visible.length - 1]?.id !== p.id}
                onMove={move}
                onRemove={() => remove(p)}
                onNavigate={onNavigate}
              />
            ))}
          </Group>
          <Group label="Division III">
            {d3.map((p) => (
              <NavItem
                key={p.id}
                program={p}
                active={activeId === p.id}
                starred={starred.includes(p.id)}
                editing={editing}
                canUp={visible[0]?.id !== p.id}
                canDown={visible[visible.length - 1]?.id !== p.id}
                onMove={move}
                onRemove={() => remove(p)}
                onNavigate={onNavigate}
              />
            ))}
          </Group>
        </>
      ) : (
        <div className="mt-1">
          {visible.map((p) => (
            <NavItem
              key={p.id}
              program={p}
              active={activeId === p.id}
              starred={starred.includes(p.id)}
              editing={editing}
              canUp={visible[0]?.id !== p.id}
              canDown={visible[visible.length - 1]?.id !== p.id}
              onMove={move}
              onRemove={() => remove(p)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
      {hidden.length > 0 ? (
        <div className="mt-3 px-1">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="px-2 py-1 text-[11px] text-subtle hover:text-fg"
          >
            Removed ({hidden.length})
          </button>
          {showHidden
            ? hidden.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted">
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <button
                    type="button"
                    className="text-[11px] text-accent hover:underline"
                    onClick={() => restoreProgram(p.id)}
                  >
                    Restore
                  </button>
                </div>
              ))
            : null}
        </div>
      ) : null}
    </nav>
  );
}

function orderedVisible(programs: Program[], navOrder: string[], hiddenIds: string[]) {
  const hidden = new Set(hiddenIds);
  const visible = programs.filter((p) => !hidden.has(p.id));
  if (!navOrder.length) {
    const d1 = visible.filter((p) => p.div !== "D3");
    const d3 = visible.filter((p) => p.div === "D3");
    return [...d1, ...d3];
  }
  const rank = new Map(navOrder.map((id, i) => [id, i]));
  return [...visible].sort(
    (a, b) => (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000) || a.name.localeCompare(b.name),
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-2">
      <div className="px-3 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({
  program,
  active,
  starred,
  editing,
  canUp,
  canDown,
  onMove,
  onRemove,
  onNavigate,
}: {
  program: Program;
  active: boolean;
  starred: boolean;
  editing: boolean;
  canUp: boolean;
  canDown: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: () => void;
  onNavigate?: () => void;
}) {
  const live = program.events.some((e) => e.status === "live");
  const range = openingForecast(program).rangeLabel;
  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-1 rounded-lg px-2 py-1.5 text-sm",
        active ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]" : "text-muted",
      )}
    >
      {editing ? (
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-label={`Move ${program.name} up`}
            disabled={!canUp}
            onClick={() => onMove(program.id, -1)}
            className="text-subtle hover:text-fg disabled:opacity-30"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Move ${program.name} down`}
            disabled={!canDown}
            onClick={() => onMove(program.id, 1)}
            className="text-subtle hover:text-fg disabled:opacity-30"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      ) : null}
      <Link
        to="/team/$id"
        params={{ id: program.id }}
        onClick={onNavigate}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1",
          !active && "hover:text-fg",
        )}
      >
        <span className="min-w-0 flex-1 truncate font-medium">{program.name}</span>
        {starred ? <Star className="size-3 shrink-0 fill-accent text-accent" /> : null}
        {live ? (
          <span className="size-1.5 shrink-0 rounded-full bg-live" title="Live this week" />
        ) : null}
        {!editing ? <Badge variant={program.div === "D3" ? "default" : "accent"}>{program.div}</Badge> : null}
        {!editing ? (
          <span className="w-10 shrink-0 text-right font-mono text-[10px] text-subtle">{range}</span>
        ) : null}
      </Link>
      {editing ? (
        <button
          type="button"
          aria-label={`Remove ${program.name} from the list`}
          onClick={onRemove}
          className="shrink-0 rounded-md p-1 text-subtle hover:bg-surface-3 hover:text-over"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
