import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      organizer: null,

      setAuth: (token, organizer) => set({ token, organizer }),

      updateOrganizer: (updates) => set(s => ({
        organizer: s.organizer ? { ...s.organizer, ...updates } : updates,
      })),

      logout: () => set({ token: null, organizer: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'pochi-auth',
      partialize: (s) => ({ token: s.token, organizer: s.organizer }),
    }
  )
)
