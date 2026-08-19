import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_PREFIX, FREE_CREDITS_ON_SIGNUP } from '@/constants/config';
import { mockUser } from '@/services/mockData';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  hasOnboarded: boolean;
  hydrate: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOtp: (mobile: string) => Promise<{ challengeId: string }>;
  verifyOtp: (challengeId: string, code: string) => Promise<void>;
  register: (input: { name: string; mobile: string; email: string; password: string; role: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setUser: (u: User) => void;
}

const K_TOKEN = `${STORAGE_PREFIX}:token`;
const K_USER = `${STORAGE_PREFIX}:user`;
const K_ONB = `${STORAGE_PREFIX}:onboarded`;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  hasOnboarded: false,

  async hydrate() {
    const [token, userJson, onb] = await Promise.all([
      AsyncStorage.getItem(K_TOKEN),
      AsyncStorage.getItem(K_USER),
      AsyncStorage.getItem(K_ONB),
    ]);
    set({
      accessToken: token,
      user: userJson ? JSON.parse(userJson) : null,
      hasOnboarded: onb === '1',
      hydrated: true,
    });
  },

  async signInWithPassword(email, _password) {
    await new Promise((r) => setTimeout(r, 400));
    const cleanEmail = email.trim().toLowerCase();
    let role: UserRole = 'individual';
    let name = 'Individual User';
    let plan: User['plan'] = 'premium';

    if (cleanEmail === 'admin@gmail.com') {
      role = 'admin';
      name = 'Admin User';
      plan = 'commercial_pro';
    } else if (cleanEmail === 'commercial@gmail.com') {
      role = 'commercial';
      name = 'Commercial Vendor';
      plan = 'commercial_pro';
    } else if (cleanEmail === 'individual@gmail.com') {
      role = 'individual';
      name = 'Individual User';
      plan = 'premium';
    }

    const user: User = {
      ...mockUser,
      email: cleanEmail,
      role,
      name,
      plan,
    };
    await AsyncStorage.multiSet([
      [K_TOKEN, 'mock.jwt.token'],
      [K_USER, JSON.stringify(user)],
    ]);
    set({ user, accessToken: 'mock.jwt.token' });
  },

  async signInWithOtp(_mobile) {
    await new Promise((r) => setTimeout(r, 400));
    return { challengeId: 'mock-challenge' };
  },

  async verifyOtp(_challengeId, _code) {
    await new Promise((r) => setTimeout(r, 400));
    const user: User = { ...mockUser };
    await AsyncStorage.multiSet([
      [K_TOKEN, 'mock.jwt.token'],
      [K_USER, JSON.stringify(user)],
    ]);
    set({ user, accessToken: 'mock.jwt.token' });
  },

  async register(input) {
    await new Promise((r) => setTimeout(r, 500));
    const user: User = {
      ...mockUser,
      id: `u-${Date.now()}`,
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      role: input.role,
      credits: FREE_CREDITS_ON_SIGNUP,
      plan: 'free',
      kycStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.multiSet([
      [K_TOKEN, 'mock.jwt.token'],
      [K_USER, JSON.stringify(user)],
    ]);
    set({ user, accessToken: 'mock.jwt.token' });
  },

  async signOut() {
    await AsyncStorage.multiRemove([K_TOKEN, K_USER]);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  async completeOnboarding() {
    await AsyncStorage.setItem(K_ONB, '1');
    set({ hasOnboarded: true });
  },

  setUser(u) {
    AsyncStorage.setItem(K_USER, JSON.stringify(u));
    set({ user: u });
  },
}));
