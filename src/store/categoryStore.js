import { create } from "zustand";

// Shared between the drawer sidebar and the contractor screen.
export const useCategoryStore = create((set) => ({
  activeId: null,
  expandedIds: new Set(),

  select: (id, ancestors = []) =>
    set((s) => ({
      activeId: id,
      expandedIds: new Set([...s.expandedIds, ...ancestors]),
    })),

  toggle: (id) =>
    set((s) => {
      const next = new Set(s.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedIds: next };
    }),

  setExpanded: (ids) => set({ expandedIds: new Set(ids) }),
}));