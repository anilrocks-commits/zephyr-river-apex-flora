import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { openingForecast } from "@/lib/model";
import { Badge } from "@/components/ui/badge";
import { useIntelStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProgramNav({
  activeId,
  onNavigate,
}: {
  activeId?: string;
  onNavigate?: () => void;
}) {
  const starred = useIntelStore((s) => s.starred);
  const d1 = PROGRAMS.filter((p) => p.div === "D1");
  const d3 = PROGRAMS.filter((p) => p.div === "D3");

  return (
    <nav className="flex flex-col gap-1 px-2 pb-8">
      <Group label="Division I">
        {d1.map((p) => (
          <NavItem
            key={p.id}
            id={p.id}
            name={p.name}
            div={p.div}
            live={p.events.some((e) => e.status === "live")}
            range={openingForecast(p).rangeLabel}
            active={activeId === p.id}
            starred={starred.includes(p.id)}
            onNavigate={onNavigate}
          />
        ))}
      </Group>
      <Group label="Division III">
        {d3.map((p) => (
          <NavItem
            key={p.id}
            id={p.id}
            name={p.name}
            div={p.div}
            live={p.events.some((e) => e.status === "live")}
            range={openingForecast(p).rangeLabel}
            active={activeId === p.id}
            starred={starred.includes(p.id)}
            onNavigate={onNavigate}
          />
        ))}
      </Group>
    </nav>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <div className="px-3 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({
  id,
  name,
  div,
  live,
  range,
  active,
  starred,
  onNavigate,
}: {
  id: string;
  name: string;
  div: string;
  live: boolean;
  range: string;
  active: boolean;
  starred: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to="/team/$id"
      params={{ id }}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
        active
          ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]"
          : "text-muted hover:bg-surface-2/70 hover:text-fg",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      {starred ? <Star className="size-3 shrink-0 fill-accent text-accent" /> : null}
      {live ? (
        <span className="size-1.5 shrink-0 rounded-full bg-live" title="Live this week" />
      ) : null}
      <Badge variant={div === "D3" ? "default" : "accent"}>{div}</Badge>
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-subtle">
        {range}
      </span>
    </Link>
  );
}
