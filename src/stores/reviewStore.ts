'use client'

import { create } from 'zustand'
import type { PeriodReview, DailyReview } from '@/types/review'

interface ReviewState {
  dailyReview: DailyReview | null
  periodReviews: PeriodReview[]
  isLoading: boolean
  error: string | null

  fetchDailyReview: (date: string) => Promise<void>
  submitDailyReview: (data: Omit<DailyReview, 'createdAt'>) => Promise<void>
  fetchPeriodReview: (type: 'weekly' | 'monthly', periodKey: string) => Promise<void>
  generatePeriodReview: (type: 'weekly' | 'monthly', periodKey: string) => Promise<void>
  clearError: () => void
}

export const useReviewStore = create<ReviewState>()((set) => ({
  dailyReview: null,
  periodReviews: [],
  isLoading: false,
  error: null,

  fetchDailyReview: async (date) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/reviews/daily?date=${date}`)
      if (res.ok) {
        const { data } = await res.json()
        set({ dailyReview: data, isLoading: false })
      } else {
        set({ dailyReview: null, isLoading: false })
      }
    } catch {
      set({ dailyReview: null, isLoading: false })
    }
  },

  submitDailyReview: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/reviews/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to submit daily review')
      const { data: review } = await res.json()
      set({ dailyReview: review, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to submit daily review',
        isLoading: false,
      })
    }
  },

  fetchPeriodReview: async (type, periodKey) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/reviews/period?type=${type}&periodKey=${periodKey}`)
      if (res.ok) {
        const { data } = await res.json()
        set((state) => ({
          periodReviews: [...state.periodReviews.filter((r) => !(r.type === type && r.periodKey === periodKey)), data],
          isLoading: false,
        }))
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  generatePeriodReview: async (type, periodKey) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/reviews/period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, periodKey }),
      })
      if (!res.ok) throw new Error('Failed to generate review')
      const { data } = await res.json()
      set((state) => ({
        periodReviews: [...state.periodReviews.filter((r) => !(r.type === type && r.periodKey === periodKey)), data],
        isLoading: false,
      }))
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to generate review',
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
