import { create } from 'zustand';
export const useFavoritesStore = create((set, get) => ({
    favorites: {},
    compareList: [],
    toggleFavorite(id) {
        const cur = { ...get().favorites };
        if (cur[id])
            delete cur[id];
        else
            cur[id] = true;
        set({ favorites: cur });
    },
    isFavorite(id) {
        return !!get().favorites[id];
    },
    toggleCompare(id) {
        const cur = get().compareList;
        if (cur.includes(id))
            set({ compareList: cur.filter((x) => x !== id) });
        else if (cur.length < 3)
            set({ compareList: [...cur, id] });
    },
    isInCompare(id) {
        return get().compareList.includes(id);
    },
    clearCompare() {
        set({ compareList: [] });
    },
}));
