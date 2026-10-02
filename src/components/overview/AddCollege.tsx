import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/data/types";
import type { LiveTeam } from "@/lib/live";
import { useIntelStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function AddCollege() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addCustomProgram = useIntelStore((s) => s.addCustomProgram);
  const customPrograms = useIntelStore((s) => s.customPrograms);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const takenIds = [...PROGRAMS, ...customPrograms].map((p) => p.id);
      const takenClippdIds = [...PROGRAMS, ...customPrograms]
        .map((p) => p.clippdTeamId || p.clippd.match(/teams\/(\d+)/)?.[1])
        .filter(Boolean);
      const res = await fetch("/api/college", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, takenIds, takenClippdIds }),
      });
      const data = (await res.json()) as
        | { program: Program; live: LiveTeam }
        | { statusMessage?: string; message?: string };
      if (!res.ok) {
        throw new Error(
          ("statusMessage" in data && data.statusMessage) ||
            ("message" in data && data.message) ||
            `Import failed (${res.status})`,
        );
      }
      if (!("program" in data)) throw new Error("Import returned no program");
      addCustomProgram(data.program, data.live);
      setInput("");
      setOpen(false);
      void navigate({ to: "/team/$id", params: { id: data.program.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-medium">Add a college</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Paste a Clippd team URL or id. We pull roster, schedule, recent
            scorecards, and 2027 public commits — no code change required.
          </p>
        </div>
        {!open ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Add
          </Button>
        ) : null}
      </div>
      {open ? (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://scoreboard.clippd.com/teams/3916"
            className="h-10 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
          />
          {error ? <p className="text-xs text-over">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !input.trim()}>
              {busy ? "Importing…" : "Import from Clippd"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-[11px] text-subtle">
            Saved in this browser. Use Refresh on the team page for new cards.
            Pin a school in the shared watchlist if you want the 6am GitHub job
            to keep it updated for everyone.
          </p>
        </form>
      ) : null}
    </div>
  );
}
