import type { ComponentProps, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  side = "left",
}: {
  className?: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-in" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex h-full w-[min(20rem,92vw)] flex-col bg-surface shadow-[var(--shadow-border)] outline-none",
          side === "left" ? "inset-y-0 left-0" : "inset-y-0 right-0",
          className,
        )}
      >
        <Dialog.Title className="sr-only">Programs</Dialog.Title>
        <Dialog.Description className="sr-only">
          Choose a program on the 2027 watch list
        </Dialog.Description>
        {children}
        <Dialog.Close className="absolute right-3 top-3 rounded-md p-2 text-muted hover:text-fg">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn("font-display text-lg font-medium", className)}
      {...props}
    />
  );
}
