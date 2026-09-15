import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Flag } from "lucide-react";
import { ProgramNav } from "@/components/layout/ProgramNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppShell({
  children,
  activeId,
}: {
  children: ReactNode;
  activeId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/90 px-3 py-3 backdrop-blur-sm sm:px-5">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open programs">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="px-4 pb-2 pt-5 font-display text-lg font-medium">
              Programs
            </div>
            <ScrollArea className="h-[calc(100%-4rem)]">
              <ProgramNav activeId={activeId} onNavigate={() => setOpen(false)} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-surface-2 text-accent">
            <Flag className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg font-medium leading-none tracking-tight">
              Arjun Golf
            </span>
            <span className="mt-0.5 hidden text-[11px] text-subtle sm:block">
              2027 recruiting intelligence
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-muted sm:inline">
            Updated Sep 14, 2026
          </span>
          <Link
            to="/model"
            className="rounded-md px-3 py-2 text-xs text-muted hover:text-fg"
          >
            Model
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[3.35rem] hidden h-[calc(100vh-3.35rem)] w-64 shrink-0 border-r border-border bg-surface lg:block">
          <ScrollArea className="h-full">
            <div className="px-3 pt-4">
              <Link
                to="/"
                className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg"
              >
                Watch list
              </Link>
            </div>
            <ProgramNav activeId={activeId} />
            <p className="px-5 pb-8 pt-2 text-[11px] leading-relaxed text-subtle">
              Senior count is the theoretical ceiling. Actual 2027 opportunity is turnover plus
              coach selection plus performance.
            </p>
          </ScrollArea>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
