import { create } from 'zustand';

// This store is now deprecated - use useAuth hook instead
// Keeping minimal implementation for backward compatibility during migration

interface AdminStore {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>()((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
  logout: () => set({ isAuthenticated: false }),
}));
