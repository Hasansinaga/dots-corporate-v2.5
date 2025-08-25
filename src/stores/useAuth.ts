import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = { id: string; name: string; email: string };

type AuthState = {
  user: User | null;
  hydrated: boolean;
  signIn: (u: User) => void;
  signOut: () => void;
  hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  hydrated: false,
  
  signIn: (u) => {
    console.log('[auth] Signing in user:', u.email);
    set({ user: u });
    // Optionally save to AsyncStorage for persistence
    AsyncStorage.setItem('user', JSON.stringify(u)).catch(console.warn);
  },
  
  signOut: async () => {
    console.log('[auth] Signing out user');
    
    // Clear user state immediately
    set({ user: null });
    
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['user', 'authToken', 'trackingActive']);
      console.log('[auth] AsyncStorage cleared');
    } catch (error) {
      console.warn('[auth] Error clearing AsyncStorage:', error);
    }
    
    // Optional: Clear any other app state or navigate to login
    // This might be handled by your navigation logic
  },
  
  hydrate: async () => {
    try {
      console.log('[auth] Hydrating auth state...');
      const userJson = await AsyncStorage.getItem('user');
      let user: User | null = null;
      
      if (userJson) {
        try {
          user = JSON.parse(userJson);
          console.log('[auth] User loaded from storage:', user?.email);
        } catch (parseError) {
          console.warn('[auth] Error parsing stored user:', parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem('user');
        }
      }
      
      set({ user, hydrated: true });
    } catch (error) {
      console.error('[auth] Error hydrating auth state:', error);
      set({ user: null, hydrated: true });
    }
  },
}));