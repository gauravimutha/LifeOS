import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LocalUser {
  id: string
  email: string
  name: string
  onboardingCompleted: boolean
  user_metadata?: {
    full_name?: string
  }
}

interface AuthState {
  user: LocalUser | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: LocalUser | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => {
        if (user && !user.user_metadata) {
          user.user_metadata = { full_name: user.name }
        }
        set({ user, isAuthenticated: !!user })
      },

      setLoading: (isLoading) =>
        set({ isLoading }),

      signOut: async () => {
        set({ user: null, isAuthenticated: false })
      },

      initialize: async () => {
        // Zustand persist middleware handles restoring from localStorage automatically.
        // We just mark loading as complete.
        set({ isLoading: false })
      },
    }),
    {
      name: 'lifeos-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
