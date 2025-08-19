import { create } from 'zustand';

type User = { id: string; name: string; email: string };

type AuthState = {
  user: User | null;
  hydrated: boolean;
  signIn: (u: User) => void;
  signOut: () => void;
  hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  hydrated: false,
  signIn: (u) => set({ user: u }),
  signOut: () => set({ user: null }),
  hydrate: async () => {
    const u: User | null = null;
    set({ user: u, hydrated: true });
  },
}));
