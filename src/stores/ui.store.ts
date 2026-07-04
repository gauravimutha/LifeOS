import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  type: 'goal' | 'task' | 'habit' | 'journal' | 'ai' | 'system'
  createdAt: string
}

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  currentMode: string
  notifications: Notification[]

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCurrentMode: (mode: string) => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  unreadCount: () => number
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'system',
      currentMode: 'normal',
      notifications: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setTheme: (theme) => set({ theme }),

      setCurrentMode: (currentMode) => set({ currentMode }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'lifeos-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        currentMode: state.currentMode,
      }),
    },
  ),
)
