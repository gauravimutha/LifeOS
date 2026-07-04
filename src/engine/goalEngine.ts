import type {
  Goal,
  GoalStatus,
  GoalLevel,
  GoalAIAnalysis,
  GoalTreeNode,
  GoalStats,
  GoalMilestone,
  CreateGoalInput,
} from '@/types/goal'
import { LEVEL_HIERARCHY, STATUS_TRANSITIONS, PRISMA_TO_LEVEL, LEVEL_TO_PRISMA } from '@/types/goal'
import { db } from '@/lib/db'

export function normalizeLevel(level: string): GoalLevel {
  return PRISMA_TO_LEVEL[level] ?? (level as GoalLevel)
}

export function canTransition(from: GoalStatus, to: GoalStatus): boolean {
  const allowed = STATUS_TRANSITIONS[from]
  return allowed?.includes(to) ?? false
}

export function getAvailableTransitions(status: GoalStatus): GoalStatus[] {
  return STATUS_TRANSITIONS[status] ?? []
}

export function suggestLevel(targetDate: string | null | undefined): GoalLevel {
  if (!targetDate) return 'long-term'
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  const diffMs = target - now
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays <= 7) return 'weekly'
  if (diffDays <= 31) return 'monthly'
  if (diffDays <= 92) return 'quarterly'
  if (diffDays <= 365) return 'yearly'
  return 'long-term'
}

export function validateGoalInput(input: CreateGoalInput): string | null {
  if (!input.title || input.title.trim().length === 0) {
    return 'Title is required'
  }
  if (input.title.length > 200) {
    return 'Title must be 200 characters or less'
  }
  if (input.description && input.description.length > 2000) {
    return 'Description must be 2000 characters or less'
  }
  return null
}

export function validateHierarchy(
  parentId: string | null | undefined,
  potentialChildId: string,
  allGoals: Goal[],
): string | null {
  if (!parentId) return null
  if (parentId === potentialChildId) {
    return 'A goal cannot be its own parent'
  }

  const childrenMap = new Map<string, string[]>()
  for (const g of allGoals) {
    if (g.parentGoalId) {
      const kids = childrenMap.get(g.parentGoalId) ?? []
      kids.push(g.id)
      childrenMap.set(g.parentGoalId, kids)
    }
  }

  const visited = new Set<string>()
  const queue = [parentId]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === potentialChildId) {
      return 'Circular hierarchy detected'
    }
    if (visited.has(current)) continue
    visited.add(current)
    const kids = childrenMap.get(current) ?? []
    queue.push(...kids)
  }

  return null
}

export function validateLevelHierarchy(
  parentLevel: GoalLevel | null | undefined,
  childLevel: GoalLevel,
): string | null {
  if (!parentLevel) return null
  if (LEVEL_HIERARCHY[childLevel] <= LEVEL_HIERARCHY[parentLevel]) {
    return `Child goal level (${childLevel}) must be more granular than parent level (${parentLevel})`
  }
  return null
}

export function calculateProgress(
  goal: Goal,
  children: Goal[],
): number {
  if (goal.status === 'completed') return 100
  if (children.length === 0) {
    const milestones = goal.metadata?.milestones ?? []
    if (milestones.length > 0) {
      const completed = milestones.filter((m) => m.completed).length
      return Math.round((completed / milestones.length) * 100)
    }
    return 0
  }

  const totalProgress = children.reduce((sum, child) => sum + child.progress, 0)
  return Math.round(totalProgress / children.length)
}

export function calculateHealthScore(goal: Goal): number {
  let score = 50

  score += Math.min(goal.progress / 2, 20)

  if (goal.status === 'active') score += 10
  if (goal.status === 'paused') score -= 15
  if (goal.status === 'completed') score += 30

  const priorityBonus = (goal.priority - 1) * 5
  score += Math.min(priorityBonus, 15)

  const milestones = goal.metadata?.milestones ?? []
  if (milestones.length > 0) {
    const completedRatio = milestones.filter((m) => m.completed).length / milestones.length
    score += completedRatio * 10
  }

  if (goal.targetDate) {
    const now = Date.now()
    const target = new Date(goal.targetDate).getTime()
    const diffDays = (target - now) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) score -= 20
    else if (diffDays < 7) score -= 5
    else if (diffDays > 365) score -= 5
  }

  if (goal.description) score += 5
  if (goal.metadata?.whyItMatters) score += 5

  return Math.max(0, Math.min(100, score))
}

export function calculateConfidenceScore(analysis: GoalAIAnalysis | null | undefined): number {
  if (!analysis) return 0

  let score = 50

  if (analysis.category) score += 10
  if (analysis.priority) score += 5
  if (analysis.difficulty) score += 5
  if (analysis.estimatedDuration) score += 5
  if (analysis.weeklyCommitment > 0) score += 5

  const milestones = analysis.milestones ?? []
  if (milestones.length >= 2) score += 10
  else if (milestones.length >= 1) score += 5

  const metrics = analysis.successMetrics ?? []
  if (metrics.length >= 2) score += 10
  else if (metrics.length >= 1) score += 5

  if (analysis.skillsRequired && analysis.skillsRequired.length > 0) score += 5
  if (analysis.resources && analysis.resources.length > 0) score += 5

  if (analysis.risks && analysis.risks.length > 0) score += 5
  if (analysis.opportunities && analysis.opportunities.length > 0) score += 5

  return Math.max(0, Math.min(100, score))
}

export function buildGoalTree(goals: Goal[]): GoalTreeNode[] {
  const goalMap = new Map<string, GoalTreeNode>()
  const roots: GoalTreeNode[] = []

  for (const goal of goals) {
    goalMap.set(goal.id, {
      ...goal,
      children: [],
      depth: 0,
    })
  }

  for (const goal of goals) {
    const node = goalMap.get(goal.id)!
    if (goal.parentGoalId && goalMap.has(goal.parentGoalId)) {
      const parent = goalMap.get(goal.parentGoalId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortByLevel = (nodes: GoalTreeNode[]) => {
    nodes.sort((a, b) => {
      const levelDiff = LEVEL_HIERARCHY[a.level] - LEVEL_HIERARCHY[b.level]
      if (levelDiff !== 0) return levelDiff
      return b.priority - a.priority
    })
    for (const node of nodes) {
      sortByLevel(node.children)
    }
  }
  sortByLevel(roots)

  return roots
}

export function computeStats(goals: Goal[]): GoalStats {
  const stats: GoalStats = {
    total: goals.length,
    active: 0,
    completed: 0,
    paused: 0,
    cancelled: 0,
    byLevel: {} as GoalStats['byLevel'],
    byCategory: {},
    averageProgress: 0,
    averageHealth: 0,
    overdueCount: 0,
  }

  for (const level of ['vision', 'long-term', 'yearly', 'quarterly', 'monthly', 'weekly'] as GoalLevel[]) {
    stats.byLevel[level] = 0
  }

  for (const goal of goals) {
    if (goal.status === 'active') stats.active++
    if (goal.status === 'completed') stats.completed++
    if (goal.status === 'paused') stats.paused++
    if (goal.status === 'cancelled') stats.cancelled++
    stats.byLevel[goal.level] = (stats.byLevel[goal.level] ?? 0) + 1

    const category = goal.metadata?.category
    if (category) {
      stats.byCategory[category] = (stats.byCategory[category] ?? 0) + 1
    }

    stats.averageProgress += goal.progress
    stats.averageHealth += calculateHealthScore(goal)

    if (goal.targetDate && goal.status === 'active') {
      const target = new Date(goal.targetDate)
      if (target < new Date()) {
        stats.overdueCount++
      }
    }
  }

  if (goals.length > 0) {
    stats.averageProgress = Math.round(stats.averageProgress / goals.length)
    stats.averageHealth = Math.round(stats.averageHealth / goals.length)
  }

  return stats
}

export function filterActiveAndIncomplete(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'active' || g.status === 'paused' || g.status === 'draft')
}

export function getMilestonesStatus(milestones: GoalMilestone[]): {
  total: number
  completed: number
  pending: number
  percentage: number
} {
  const total = milestones.length
  const completed = milestones.filter((m) => m.completed).length
  return {
    total,
    completed,
    pending: total - completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

export function isOverdue(goal: Goal): boolean {
  if (!goal.targetDate || goal.status === 'completed' || goal.status === 'cancelled' || goal.status === 'archived') {
    return false
  }
  return new Date(goal.targetDate) < new Date()
}

export function isAtRisk(goal: Goal): boolean {
  if (goal.status !== 'active') return false
  const health = calculateHealthScore(goal)
  if (health < 40) return true
  if (isOverdue(goal)) return true
  return false
}

const LEVEL_ORDER: GoalLevel[] = ['vision', 'long-term', 'yearly', 'quarterly', 'monthly', 'weekly']
const NEXT_LEVEL: Record<GoalLevel, GoalLevel | null> = {
  'vision': 'long-term',
  'long-term': 'yearly',
  'yearly': 'quarterly',
  'quarterly': 'monthly',
  'monthly': 'weekly',
  'weekly': null,
}

export const goalEngine = {
  async decomposeGoal(goalId: string, userId: string) {
    const goal = await db.goal.findUnique({ where: { id: goalId } })
    if (!goal) return { goal: null, suggestions: [], error: 'Goal not found' }

    const childLevel = NEXT_LEVEL[goal.level as GoalLevel] ?? 'weekly'
    const suggestions = [
      {
        title: `Research & plan ${goal.title}`,
        level: childLevel,
        description: `Initial research and planning phase for ${goal.title}`,
        suggestedOrder: 1,
      },
      {
        title: `Execute ${goal.title}`,
        level: childLevel,
        description: `Main execution phase for ${goal.title}`,
        suggestedOrder: 2,
      },
      {
        title: `Review ${goal.title}`,
        level: childLevel,
        description: `Review and reflect on ${goal.title}`,
        suggestedOrder: 3,
      },
    ]

    return { goal, suggestions, error: null }
  },

  async getGoalTree(goalId: string) {
    const result = await db.$queryRawUnsafe<Array<{
      id: string
      title: string
      level: string
      status: string
      progress: number
      parent_goal_id: string | null
      depth: number
      path: string
    }>>(
      `WITH RECURSIVE goal_tree AS (
        SELECT id, title, level, status, progress, parent_goal_id, 0 as depth, id::text as path
        FROM goals WHERE id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT g.id, g.title, g.level, g.status, g.progress, g.parent_goal_id, gt.depth + 1, gt.path || '->' || g.id
        FROM goals g
        INNER JOIN goal_tree gt ON g.parent_goal_id = gt.id
        WHERE g.deleted_at IS NULL
      )
      SELECT * FROM goal_tree ORDER BY path`,
      goalId,
    )
    return result
  },

  async calculateGoalProgress(goalId: string) {
    const goal = await db.goal.findUnique({ where: { id: goalId } })
    if (!goal) return 0
    if (goal.status === 'completed') return 100

    const children = await db.goal.findMany({ where: { parentGoalId: goalId, deletedAt: null } })
    if (children.length > 0) {
      let totalProgress = 0
      for (const child of children) {
        const childProgress = await this.calculateGoalProgress(child.id)
        totalProgress += childProgress
      }
      const avg = Math.round(totalProgress / children.length)
      await db.goal.update({ where: { id: goalId }, data: { progress: avg } })
      return avg
    }

    const steps = await db.roadmapStep.findMany({
      where: {
        roadmap: { goalId }
      }
    })
    if (steps.length > 0) {
      const completed = steps.filter((t) => t.isCompleted).length
      const pct = Math.round((completed / steps.length) * 100)
      await db.goal.update({ where: { id: goalId }, data: { progress: pct } })
      return pct
    }

    return goal.progress
  },

  async rebalanceGoals(userId: string) {
    const goals = await db.goal.findMany({
      where: { userId, deletedAt: null, status: { not: 'completed' } },
    })

    const domainCount: Record<string, { count: number; totalProgress: number }> = {}
    for (const goal of goals) {
      const tags = goal.tags ?? []
      const domains = tags.length > 0 ? tags : ['uncategorized']
      for (const domain of domains) {
        if (!domainCount[domain]) domainCount[domain] = { count: 0, totalProgress: 0 }
        domainCount[domain].count++
        domainCount[domain].totalProgress += goal.progress
      }
    }

    const total = Object.values(domainCount).reduce((s, d) => s + d.count, 0)
    const distribution: Record<string, { count: number; percentage: number; avgProgress: number }> = {}
    for (const [domain, data] of Object.entries(domainCount)) {
      distribution[domain] = {
        count: data.count,
        percentage: Math.round((data.count / total) * 100),
        avgProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      }
    }

    const maxPct = Math.max(...Object.values(distribution).map((d) => d.percentage))
    const imbalanceWarning = maxPct > 50
      ? `Warning: ${Object.entries(distribution).find(([, d]) => d.percentage === maxPct)?.[0]} dominates ${maxPct}% of your goals`
      : null

    return { distribution, imbalanceWarning }
  },

  async updateParentProgress(parentGoalId: string) {
    const children = await db.goal.findMany({ where: { parentGoalId, deletedAt: null } })
    if (children.length === 0) return

    let totalProgress = 0
    for (const child of children) {
      const childProgress = await this.calculateGoalProgress(child.id)
      totalProgress += childProgress
    }
    const avgProgress = Math.round(totalProgress / children.length)

    await db.goal.update({ where: { id: parentGoalId }, data: { progress: avgProgress } })

    const parent = await db.goal.findUnique({ where: { id: parentGoalId } })
    if (parent?.parentGoalId) {
      await this.updateParentProgress(parent.parentGoalId)
    }
  },
}
