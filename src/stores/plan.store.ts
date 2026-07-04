import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TimeBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  type: 'task' | 'habit' | 'routine' | 'break' | 'focus' | 'meeting' | 'other'
  energyRequired?: 'low' | 'medium' | 'high'
  flexible: boolean
  goalId?: string
  completed: boolean
}

interface DailyPlan {
  date: string
  timeBlocks: TimeBlock[]
  note?: string
}

interface PlanState {
  currentDate: string
  currentDailyPlan: DailyPlan | null
  weeklyPlans: Record<string, TimeBlock[]>

  setCurrentDate: (date: string) => void
  setDailyPlan: (plan: DailyPlan) => void
  addTimeBlock: (block: TimeBlock) => void
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void
  removeTimeBlock: (id: string) => void
  toggleBlockComplete: (id: string) => void
  reorderTimeBlocks: (blocks: TimeBlock[]) => void
  setWeeklyPlan: (date: string, blocks: TimeBlock[]) => void
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      currentDate: new Date().toISOString().split('T')[0],
      currentDailyPlan: null,
      weeklyPlans: {},

      setCurrentDate: (currentDate) => set({ currentDate }),

      setDailyPlan: (currentDailyPlan) => set({ currentDailyPlan }),

      addTimeBlock: (block) =>
        set((state) => {
          const plan = state.currentDailyPlan
          if (!plan) {
            return {
              currentDailyPlan: {
                date: state.currentDate,
                timeBlocks: [block],
              },
            }
          }
          return {
            currentDailyPlan: {
              ...plan,
              timeBlocks: [...plan.timeBlocks, block].sort((a, b) =>
                a.startTime.localeCompare(b.startTime),
              ),
            },
          }
        }),

      updateTimeBlock: (id, updates) =>
        set((state) => {
          const plan = state.currentDailyPlan
          if (!plan) return state
          return {
            currentDailyPlan: {
              ...plan,
              timeBlocks: plan.timeBlocks.map((b) =>
                b.id === id ? { ...b, ...updates } : b,
              ),
            },
          }
        }),

      removeTimeBlock: (id) =>
        set((state) => {
          const plan = state.currentDailyPlan
          if (!plan) return state
          return {
            currentDailyPlan: {
              ...plan,
              timeBlocks: plan.timeBlocks.filter((b) => b.id !== id),
            },
          }
        }),

      toggleBlockComplete: (id) =>
        set((state) => {
          const plan = state.currentDailyPlan
          if (!plan) return state
          return {
            currentDailyPlan: {
              ...plan,
              timeBlocks: plan.timeBlocks.map((b) =>
                b.id === id ? { ...b, completed: !b.completed } : b,
              ),
            },
          }
        }),

      reorderTimeBlocks: (timeBlocks) =>
        set((state) => {
          const plan = state.currentDailyPlan
          if (!plan) return state
          return {
            currentDailyPlan: { ...plan, timeBlocks },
          }
        }),

      setWeeklyPlan: (date, blocks) =>
        set((state) => ({
          weeklyPlans: { ...state.weeklyPlans, [date]: blocks },
        })),
    }),
    {
      name: 'lifeos-plan',
      partialize: (state) => ({
        currentDate: state.currentDate,
        currentDailyPlan: state.currentDailyPlan,
        weeklyPlans: state.weeklyPlans,
      }),
    },
  ),
)
