import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Program } from "@/data/types";
import type { LiveTeam } from "@/lib/live";

interface IntelState {
  notes: Record<string, string>;
  starred: string[];
  customPrograms: Program[];
  customLive: Record<string, LiveTeam>;
  hasHydrated: boolean;
  setNote: (playerId: string, note: string) => void;
  toggleStar: (programId: string) => void;
  addCustomProgram: (program: Program, live?: LiveTeam) => void;
  removeCustomProgram: (programId: string) => void;
  setHydrated: () => void;
}

export const useIntelStore = create<IntelState>()(
  persist(
    (set, get) => ({
      notes: {},
      starred: [],
      customPrograms: [],
      customLive: {},
      hasHydrated: false,
      setNote: (playerId, note) =>
        set({ notes: { ...get().notes, [playerId]: note } }),
      toggleStar: (programId) => {
        const starred = get().starred.includes(programId)
          ? get().starred.filter((id) => id !== programId)
          : [...get().starred, programId];
        set({ starred });
      },
      addCustomProgram: (program, live) => {
        const rest = get().customPrograms.filter(
          (p) => p.id !== program.id && p.clippdTeamId !== program.clippdTeamId,
        );
        set({
          customPrograms: [...rest, program],
          customLive: live
            ? { ...get().customLive, [program.id]: live }
            : get().customLive,
        });
      },
      removeCustomProgram: (programId) => {
        const { [programId]: _, ...customLive } = get().customLive;
        set({
          customPrograms: get().customPrograms.filter((p) => p.id !== programId),
          customLive,
          starred: get().starred.filter((id) => id !== programId),
        });
      },
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "arjun-golf-intel",
      partialize: (s) => ({
        notes: s.notes,
        starred: s.starred,
        customPrograms: s.customPrograms,
        customLive: s.customLive,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
