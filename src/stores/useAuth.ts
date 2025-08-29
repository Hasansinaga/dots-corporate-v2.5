import { create } from 'zustand';
import { User } from '../shared/types/user';
import { authService } from '../features/auth/services/authService';

type AuthState = {
  user: User | null;
  hydrated: boolean;
  isLoading: boolean;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
  login: (credentials: { username: string; password: string; kodeKantor: number }) => Promise<User>;
};

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  hydrated: false,
  isLoading: false,
  
  signIn: (user: User) => {
    console.log('[auth] Signing in user:', user.username);
    set({ user });
  },
  
  signOut: async () => {
    console.log('[auth] Signing out user');
    set({ isLoading: true });
    
    try {
      await authService.logout();
      set({ user: null });
      console.log('[auth] Sign out completed');
    } catch (error) {
      console.error('[auth] Sign out error:', error);
      // Even if logout fails, clear local state
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
  
  hydrate: async () => {
    try {
      console.log('[auth] Hydrating auth state...');
      set({ isLoading: true });
      
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        if (user) {
          set({ user, hydrated: true });
          console.log('[auth] User loaded from storage:', user.username);
        } else {
          set({ user: null, hydrated: true });
          console.log('[auth] No user data found');
        }
      } else {
        set({ user: null, hydrated: true });
        console.log('[auth] User not authenticated');
      }
    } catch (error) {
      console.error('[auth] Error hydrating auth state:', error);
      set({ user: null, hydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    
    try {
      const user = await authService.login(credentials);
      set({ user });
      console.log('[auth] Login successful:', user.username);
      return user;
    } catch (error) {
      console.error('[auth] Login error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));