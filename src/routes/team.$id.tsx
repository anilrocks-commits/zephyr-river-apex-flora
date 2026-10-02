import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TeamView } from "@/components/team/TeamView";
import { useIntelStore } from "@/lib/store";
import { useRawProgram } from "@/lib/watchlist";

export const Route = createFileRoute("/team/$id")({ component: TeamPage });

function TeamPage() {
  const { id } = Route.useParams();
  const program = useRawProgram(id);
  const hasHydrated = useIntelStore((s) => s.hasHydrated);

  if (!program && !hasHydrated) {
    return (
      <AppShell>
        <p className="mx-auto max-w-lg py-16 text-center text-sm text-muted">Loading program…</p>
      </AppShell>
    );
  }

  if (!program) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="font-display text-2xl">Program not on the watch list</h1>
          <p className="mt-2 text-sm text-muted">
            That school is not in the current 2027 set. Add it from the watch list with a Clippd team URL.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
            Back to watch list
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeId={program.id}>
      <TeamView program={program} />
    </AppShell>
  );
}
