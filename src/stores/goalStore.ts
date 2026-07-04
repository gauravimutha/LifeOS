import { create } from 'zustand'
import type { Goal, GoalTreeNode, GoalStats, GoalAIAnalysis } from '@/types/goal'

interface GoalState {
  goals: Goal[]
  goalTree: GoalTreeNode[]
  selectedGoal: Goal | null
  goalAnalysis: GoalAIAnalysis | null
  stats: GoalStats | null
  isLoading: boolean
  isAnalyzing: boolean
  error: string | null

  setGoals: (goals: Goal[]) => void
  setGoalTree: (tree: GoalTreeNode[]) => void
  setSelectedGoal: (goal: Goal | null) => void
  setGoalAnalysis: (analysis: GoalAIAnalysis | null) => void
  setStats: (stats: GoalStats | null) => void
  setLoading: (loading: boolean) => void
  setAnalyzing: (analyzing: boolean) => void
  setError: (error: string | null) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void
}

export const useGoalStore = create<GoalState>()((set) => ({
  goals: [],
  goalTree: [],
  selectedGoal: null,
  goalAnalysis: null,
  stats: null,
  isLoading: false,
  isAnalyzing: false,
  error: null,

  setGoals: (goals) => set({ goals }),
  setGoalTree: (goalTree) => set({ goalTree }),
  setSelectedGoal: (selectedGoal) => set({ selectedGoal, goalAnalysis: null }),
  setGoalAnalysis: (goalAnalysis) => set({ goalAnalysis }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setError: (error) => set({ error }),

  addGoal: (goal) =>
    set((state) => ({
      goals: [...state.goals, goal],
    })),

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      selectedGoal:
        state.selectedGoal?.id === id
          ? { ...state.selectedGoal, ...updates }
          : state.selectedGoal,
    })),

  removeGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
      selectedGoal: state.selectedGoal?.id === id ? null : state.selectedGoal,
    })),
}))
