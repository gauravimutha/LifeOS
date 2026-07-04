'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyCheckin, CoachPersonality } from '@/types/checkin'

interface CheckinState {
  todayCheckin: DailyCheckin | null
  checkinHistory: DailyCheckin[]
  selectedPersonality: CoachPersonality | null
  isLoading: boolean
  error: string | null

  fetchTodayCheckin: (userId?: string) => Promise<void>
  submitCheckin: (data: Omit<DailyCheckin, 'completedAt'>) => Promise<void>
  setSelectedPersonality: (personality: CoachPersonality) => void
  clearError: () => void
}

const DEFAULT_PERSONALITY: CoachPersonality = {
  id: 'motivational',
  label: 'Motivational',
  description: 'Encouraging and uplifting',
  icon: 'Flame',
  systemPrompt: 'You are a high-energy motivational coach. Be encouraging, celebrate wins, use positive reinforcement, and inspire action. Use occasional metaphors and vivid language. The user is capable of great things — remind them of that.',
}

export const useCheckinStore = create<CheckinState>()(
  persist(
    (set, get) => ({
      todayCheckin: null,
      checkinHistory: [],
      selectedPersonality: DEFAULT_PERSONALITY,
      isLoading: false,
      error: null,

      fetchTodayCheckin: async (userId?: string) => {
        if (!userId) return
        set({ isLoading: true, error: null })
        try {
          const res = await fetch(`/api/checkins/today?userId=${userId}`)
          if (res.ok) {
            const { data } = await res.json()
            set({ todayCheckin: data, isLoading: false })
          } else {
            set({ todayCheckin: null, isLoading: false })
          }
        } catch {
          set({ todayCheckin: null, isLoading: false })
        }
      },

      submitCheckin: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/checkins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error?.message ?? 'Failed to submit check-in')
          }
          const { data: checkin } = await res.json()
          set({
            todayCheckin: checkin,
            isLoading: false,
            checkinHistory: [checkin, ...get().checkinHistory].slice(0, 30),
          })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to submit check-in',
            isLoading: false,
          })
        }
      },

      setSelectedPersonality: (personality) => set({ selectedPersonality: personality }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'lifeos-checkin',
      partialize: (state) => ({
        selectedPersonality: state.selectedPersonality,
        checkinHistory: state.checkinHistory.slice(0, 7),
        todayCheckin: state.todayCheckin,
      }),
    },
  ),
)
