import { db } from '@/lib/db'
import type { GoalLevel, GoalStatus } from '@/types/goal'
import { goalEngine } from '@/engine'

export interface CreateGoalData {
  userId: string
  title: string
  description?: string
  level?: GoalLevel
  parentGoalId?: string
  targetDate?: string
  tags?: string[]
  priority?: number
}

export interface UpdateGoalData {
  title?: string
  description?: string
  level?: GoalLevel
  parentGoalId?: string | null
  targetDate?: string | null
  priority?: number
  tags?: string[]
  status?: GoalStatus
  progress?: number
}

export interface GoalFilters {
  level?: GoalLevel
  status?: GoalStatus
  tags?: string[]
}

export const goalService = {
  async createGoal(data: CreateGoalData) {
    const goal = await db.goal.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        level: (data.level ?? 'long-term') as any,
        status: 'active' as any,
        priority: data.priority ?? 3,
        parentGoalId: data.parentGoalId ?? null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        tags: data.tags ?? [],
        metadata: {},
      },
    })

    if (data.parentGoalId) {
      const parentLabels = ['parent_of']
      for (const edgeType of parentLabels) {
        await db.lifeGraphEdge.create({
          data: {
            userId: data.userId,
            sourceEntityId: goal.id,
            sourceEntityType: 'goal',
            targetEntityId: data.parentGoalId,
            targetEntityType: 'goal',
            edgeType: edgeType as any,
            weight: 1.0,
            metadata: {},
          },
        })
      }
    }

    return goal
  },

  async getGoal(id: string) {
    const goal = await db.goal.findUnique({
      where: { id },
      include: { children: { where: { deletedAt: null } } },
    })
    if (!goal || goal.deletedAt) return null
    return goal
  },

  async updateGoal(id: string, data: UpdateGoalData) {
    const existing = await db.goal.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return null

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.level !== undefined) updateData.level = data.level as any
    if (data.parentGoalId !== undefined) updateData.parentGoalId = data.parentGoalId
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.status !== undefined) updateData.status = data.status as any
    if (data.progress !== undefined) updateData.progress = data.progress

    if (data.status === 'completed') {
      updateData.completedAt = new Date()
      updateData.progress = 100
    }

    const goal = await db.goal.update({ where: { id }, data: updateData })

    if (goal.parentGoalId) {
      await goalEngine.updateParentProgress(goal.parentGoalId)
    }

    return goal
  },

  async deleteGoal(id: string) {
    const goal = await db.goal.findUnique({ where: { id } })
    if (!goal || goal.deletedAt) return null
    await db.goal.update({ where: { id }, data: { deletedAt: new Date() } })
    await db.lifeGraphEdge.updateMany({
      where: {
        OR: [{ sourceEntityId: id }, { targetEntityId: id }],
      },
      data: { deletedAt: new Date() },
    })
    return { success: true }
  },

  async listGoals(userId: string, filters?: GoalFilters) {
    const where: any = { userId, deletedAt: null }
    if (filters?.level) where.level = filters.level as any
    if (filters?.status) where.status = filters.status as any
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }
    return db.goal.findMany({
      where,
      orderBy: [{ level: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })
  },

  async getGoalTree(id: string) {
    return goalEngine.getGoalTree(id)
  },

  async updateProgress(id: string, progress: number) {
    const goal = await db.goal.update({ where: { id }, data: { progress } })
    if (goal.parentGoalId) {
      await goalEngine.updateParentProgress(goal.parentGoalId)
    }
    return goal
  },
}
