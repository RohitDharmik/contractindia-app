import { create } from 'zustand';
import { mockLeads } from '@/services/mockData';
export const useLeadsStore = create((set, get) => ({
    leads: mockLeads,
    updateStatus(id, status) {
        set({
            leads: get().leads.map((l) => l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l),
        });
    },
    addNote(id, text) {
        set({
            leads: get().leads.map((l) => l.id === id
                ? {
                    ...l,
                    notes: [...(l.notes ?? []), { id: `nt-${Date.now()}`, text, createdAt: new Date().toISOString() }],
                    updatedAt: new Date().toISOString(),
                }
                : l),
        });
    },
    createLead(l) {
        set({ leads: [l, ...get().leads] });
    },
}));
