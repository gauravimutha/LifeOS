import type { Goal, GoalMetadata, CreateGoalInput, UpdateGoalInput, GoalLevel, GoalStatus } from '@/types/goal'
import { LEVEL_TO_PRISMA, PRISMA_TO_LEVEL } from '@/types/goal'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type PrismaGoal = Awaited<ReturnType<typeof prisma.goal.findFirst>>

function serializeGoal(prismaGoal: NonNullable<PrismaGoal> & { children?: unknown[] }): Goal {
  return {
    id: prismaGoal.id,
    userId: prismaGoal.userId,
    parentGoalId: prismaGoal.parentGoalId,
    title: prismaGoal.title,
    description: prismaGoal.description,
    level: PRISMA_TO_LEVEL[prismaGoal.level] ?? 'long-term',
    status: prismaGoal.status.toLowerCase() as GoalStatus,
    priority: prismaGoal.priority,
    progress: prismaGoal.progress,
    startDate: prismaGoal.startDate?.toISOString() ?? null,
    targetDate: prismaGoal.targetDate?.toISOString() ?? null,
    completedAt: prismaGoal.completedAt?.toISOString() ?? null,
    tags: prismaGoal.tags,
    metadata: (prismaGoal.metadata ?? {}) as GoalMetadata,
    createdAt: prismaGoal.createdAt.toISOString(),
    updatedAt: prismaGoal.updatedAt.toISOString(),
  }
}

export const goalRepository = {
  async findById(id: string): Promise<Goal | null> {
    const goal = await prisma.goal.findUnique({ where: { id } })
    return goal ? serializeGoal(goal) : null
  },

  async findByUser(userId: string): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ level: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })
    return goals.map(serializeGoal)
  },

  async findByLevel(userId: string, level: GoalLevel): Promise<Goal[]> {
    const prismaLevel = LEVEL_TO_PRISMA[level]
    const goals = await prisma.goal.findMany({
      where: { userId, level: prismaLevel as any, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    return goals.map(serializeGoal)
  },

  async findByStatus(userId: string, status: GoalStatus): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: { userId, status: status.toUpperCase() as any, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    return goals.map(serializeGoal)
  },

  async getChildren(parentId: string): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: { parentGoalId: parentId, deletedAt: null },
      orderBy: [{ level: 'asc' }, { priority: 'desc' }],
    })
    return goals.map(serializeGoal)
  },

  async getHierarchy(parentId: string | null, userId: string): Promise<Goal[]> {
    if (parentId) {
      const parent = await this.findById(parentId)
      if (!parent) return []
      const allUserGoals = await this.findByUser(userId)
      return buildSubtree(parent.id, allUserGoals)
    }

    const roots = await prisma.goal.findMany({
      where: { userId, parentGoalId: null, deletedAt: null },
      orderBy: [{ level: 'asc' }, { priority: 'desc' }],
    })
    return roots.map(serializeGoal)
  },

  async create(input: CreateGoalInput & { userId: string }): Promise<Goal> {
    const prismaLevel = input.level ? LEVEL_TO_PRISMA[input.level] : 'long_term'
    const goal = await prisma.goal.create({
      data: {
        userId: input.userId,
        parentGoalId: input.parentGoalId ?? null,
        title: input.title,
        description: input.description ?? null,
        level: prismaLevel as any,
        status: 'draft' as any,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        tags: input.tags ?? [],
        metadata: {},
      },
    })
    return serializeGoal(goal)
  },

  async update(id: string, input: UpdateGoalInput): Promise<Goal | null> {
    const data: Prisma.GoalUncheckedUpdateInput = {}
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.level !== undefined) data.level = LEVEL_TO_PRISMA[input.level] as any
    if (input.parentGoalId !== undefined) data.parentGoalId = input.parentGoalId
    if (input.targetDate !== undefined) data.targetDate = input.targetDate ? new Date(input.targetDate) : null
    if (input.priority !== undefined) data.priority = input.priority
    if (input.tags !== undefined) data.tags = input.tags
    if (input.metadata !== undefined) {
      const existing = await prisma.goal.findUnique({ where: { id }, select: { metadata: true } })
      data.metadata = { ...(existing?.metadata as Record<string, unknown> ?? {}), ...input.metadata } as any
    }

    const goal = await prisma.goal.update({ where: { id }, data })
    return serializeGoal(goal)
  },

  async updateStatus(id: string, status: GoalStatus): Promise<Goal | null> {
    const data: Prisma.GoalUncheckedUpdateInput = {
      status: status.toUpperCase() as any,
    }
    if (status === 'completed') {
      data.completedAt = new Date()
      data.progress = 100
    }
    if (status === 'active' && !data.startDate) {
      const existing = await prisma.goal.findUnique({ where: { id }, select: { startDate: true } })
      if (!existing?.startDate) {
        data.startDate = new Date()
      }
    }
    const goal = await prisma.goal.update({ where: { id }, data })
    return serializeGoal(goal)
  },

  async updateProgress(id: string, progress: number): Promise<Goal | null> {
    const goal = await prisma.goal.update({ where: { id }, data: { progress } })
    return serializeGoal(goal)
  },

  async softDelete(id: string): Promise<void> {
    await prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } })
  },

  async getStats(userId: string): Promise<{
    total: number
    active: number
    completed: number
    overdue: number
  }> {
    const now = new Date()
    const [total, active, completed, overdue] = await Promise.all([
      prisma.goal.count({ where: { userId, deletedAt: null } }),
      prisma.goal.count({ where: { userId, status: 'active', deletedAt: null } }),
      prisma.goal.count({ where: { userId, status: 'completed', deletedAt: null } }),
      prisma.goal.count({
        where: {
          userId,
          status: 'active',
          targetDate: { lt: now },
          deletedAt: null,
        },
      }),
    ])
    return { total, active, completed, overdue }
  },
}

function buildSubtree(rootId: string, allGoals: Goal[]): Goal[] {
  const result: Goal[] = []
  const children = allGoals.filter((g) => g.parentGoalId === rootId)
  for (const child of children) {
    result.push(child)
    const subtree = buildSubtree(child.id, allGoals)
    result.push(...subtree)
  }
  return result
}
