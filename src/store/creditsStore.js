import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { CREDIT_COSTS } from '@/constants/config';
export const useCreditsStore = create((set, get) => ({
    unlockedContacts: {},
    unlockedDocuments: {},
    isUnlockingContact: false,
    async unlockContact(vendorId) {
        if (get().unlockedContacts[vendorId])
            return { ok: true };
        const auth = useAuthStore.getState();
        if (!auth.user)
            return { ok: false, reason: 'Sign in required' };
        if (auth.user.credits < CREDIT_COSTS.VIEW_CONTACT)
            return { ok: false, reason: 'Insufficient credits' };
        set({ isUnlockingContact: true });
        await new Promise((r) => setTimeout(r, 350));
        auth.setUser({ ...auth.user, credits: auth.user.credits - CREDIT_COSTS.VIEW_CONTACT });
        set({
            unlockedContacts: { ...get().unlockedContacts, [vendorId]: true },
            isUnlockingContact: false,
        });
        return { ok: true };
    },
    async unlockDocument(docId) {
        if (get().unlockedDocuments[docId])
            return { ok: true };
        const auth = useAuthStore.getState();
        if (!auth.user)
            return { ok: false, reason: 'Sign in required' };
        if (auth.user.credits < CREDIT_COSTS.DOWNLOAD_DOCUMENT)
            return { ok: false, reason: 'Insufficient credits' };
        await new Promise((r) => setTimeout(r, 300));
        auth.setUser({ ...auth.user, credits: auth.user.credits - CREDIT_COSTS.DOWNLOAD_DOCUMENT });
        set({ unlockedDocuments: { ...get().unlockedDocuments, [docId]: true } });
        return { ok: true };
    },
    hasUnlockedContact(vendorId) {
        return !!get().unlockedContacts[vendorId];
    },
    hasUnlockedDocument(docId) {
        return !!get().unlockedDocuments[docId];
    },
    topUp(n) {
        const auth = useAuthStore.getState();
        if (!auth.user)
            return;
        auth.setUser({ ...auth.user, credits: auth.user.credits + n });
    },
}));
