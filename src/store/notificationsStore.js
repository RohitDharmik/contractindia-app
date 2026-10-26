import { create } from 'zustand';
import { mockNotifications } from '@/services/mockData';
export const useNotificationsStore = create((set, get) => ({
    items: mockNotifications,
    unreadCount() {
        return get().items.filter((n) => !n.read).length;
    },
    markAllRead() {
        set({ items: get().items.map((n) => ({ ...n, read: true })) });
    },
    markRead(id) {
        set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    },
    push(n) {
        set({ items: [n, ...get().items] });
    },
}));
