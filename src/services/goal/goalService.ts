import type { Goal, CreateGoalInput, UpdateGoalInput, GoalStatus, GoalTreeNode, GoalStats } from '@/types/goal'
import {
  canTransition,
  validateGoalInput,
  validateHierarchy,
  validateLevelHierarchy,
  buildGoalTree,
  computeStats,
  calculateHealthScore,
  suggestLevel,
} from '@/engine'
import { goalRepository } from './goalRepository'

export const goalService = {
  async createGoal(
    input: CreateGoalInput & { userId: string },
  ): Promise<{ goal: Goal | null; error: string | null }> {
    const validationError = validateGoalInput(input)
    if (validationError) return { goal: null, error: validationError }

    const level = input.level ?? suggestLevel(input.targetDate)
    const goal = await goalRepository.create({ ...input, level })
    return { goal, error: null }
  },

  async updateGoal(
    id: string,
    input: UpdateGoalInput,
    allGoals?: Goal[],
  ): Promise<{ goal: Goal | null; error: string | null }> {
    const existing = await goalRepository.findById(id)
    if (!existing) return { goal: null, error: 'Goal not found' }

    if (input.parentGoalId !== undefined && input.parentGoalId !== null) {
      const parent = await goalRepository.findById(input.parentGoalId)
      if (!parent) return { goal: null, error: 'Parent goal not found' }

      if (allGoals) {
        const hierarchyError = validateHierarchy(input.parentGoalId, id, allGoals)
        if (hierarchyError) return { goal: null, error: hierarchyError }
      }

      const levelError = validateLevelHierarchy(parent.level, input.level ?? existing.level)
      if (levelError) return { goal: null, error: levelError }
    }

    const goal = await goalRepository.update(id, input)
    return { goal, error: null }
  },

  async transitionGoal(
    id: string,
    newStatus: GoalStatus,
  ): Promise<{ goal: Goal | null; error: string | null }> {
    const existing = await goalRepository.findById(id)
    if (!existing) return { goal: null, error: 'Goal not found' }

    if (!canTransition(existing.status, newStatus)) {
      return {
        goal: null,
        error: `Cannot transition from ${existing.status} to ${newStatus}`,
      }
    }

    if (newStatus === 'active' && existing.status === 'draft') {
      const metadata = existing.metadata
      if (!metadata?.category || !metadata?.difficulty) {
        return { goal: null, error: 'Goal must be analyzed by AI before activating' }
      }
    }

    const goal = await goalRepository.updateStatus(id, newStatus)
    return { goal, error: null }
  },

  async getGoalTree(userId: string): Promise<GoalTreeNode[]> {
    const goals = await goalRepository.findByUser(userId)
    return buildGoalTree(goals)
  },

  async getGoalWithDetails(id: string): Promise<{ goal: Goal | null; health: number; children: Goal[] }> {
    const goal = await goalRepository.findById(id)
    if (!goal) return { goal: null, health: 0, children: [] }
    const children = await goalRepository.getChildren(id)
    const health = calculateHealthScore(goal)
    return { goal, health, children }
  },

  async getStats(userId: string): Promise<GoalStats> {
    const goals = await goalRepository.findByUser(userId)
    return computeStats(goals)
  },

  async deleteGoal(id: string): Promise<{ error: string | null }> {
    const existing = await goalRepository.findById(id)
    if (!existing) return { error: 'Goal not found' }
    await goalRepository.softDelete(id)
    return { error: null }
  },

  async activateGoal(id: string): Promise<{ goal: Goal | null; error: string | null }> {
    return this.transitionGoal(id, 'active')
  },

  async pauseGoal(id: string): Promise<{ goal: Goal | null; error: string | null }> {
    return this.transitionGoal(id, 'paused')
  },

  async completeGoal(id: string): Promise<{ goal: Goal | null; error: string | null }> {
    return this.transitionGoal(id, 'completed')
  },

  async cancelGoal(id: string): Promise<{ goal: Goal | null; error: string | null }> {
    return this.transitionGoal(id, 'cancelled')
  },

  async archiveGoal(id: string): Promise<{ goal: Goal | null; error: string | null }> {
    return this.transitionGoal(id, 'archived')
  },
}
