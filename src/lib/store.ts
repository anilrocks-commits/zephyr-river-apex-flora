import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IntelState {
  notes: Record<string, string>;
  starred: string[];
  setNote: (playerId: string, note: string) => void;
  toggleStar: (programId: string) => void;
}

export const useIntelStore = create<IntelState>()(
  persist(
    (set, get) => ({
      notes: {},
      starred: [],
      setNote: (playerId, note) =>
        set({ notes: { ...get().notes, [playerId]: note } }),
      toggleStar: (programId) => {
        const starred = get().starred.includes(programId)
          ? get().starred.filter((id) => id !== programId)
          : [...get().starred, programId];
        set({ starred });
      },
    }),
    { name: "arjun-golf-intel" },
  ),
);
