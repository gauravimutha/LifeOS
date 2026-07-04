export const GOAL_LEVELS = [
  'vision',
  'long-term',
  'yearly',
  'quarterly',
  'monthly',
  'weekly',
] as const

export type GoalLevel = (typeof GOAL_LEVELS)[number]

export const GOAL_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

export type GoalPriority = (typeof GOAL_PRIORITIES)[number]

export const GOAL_STATUSES = ['draft', 'active', 'paused', 'completed', 'cancelled', 'archived'] as const

export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const DEFAULT_GOAL_CATEGORIES = [
  'career',
  'fitness',
  'family',
  'friends',
  'learning',
  'personal-growth',
  'rest',
]

export type GoalCategory = string

export const GOAL_DIFFICULTIES = ['easy', 'medium', 'hard', 'very_hard'] as const

export type GoalDifficulty = (typeof GOAL_DIFFICULTIES)[number]

export const GOAL_VISIBILITIES = ['private', 'public'] as const

export type GoalVisibility = (typeof GOAL_VISIBILITIES)[number]

export interface GoalMilestone {
  title: string
  description?: string
  targetDate?: string
  completed: boolean
  completedAt?: string
}

export interface GoalRisk {
  description: string
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation?: string
}

export interface GoalOpportunity {
  description: string
  potentialImpact: 'low' | 'medium' | 'high'
  effortRequired: 'low' | 'medium' | 'high'
}

export interface GoalAIAnalysis {
  category: GoalCategory
  priority: GoalPriority
  difficulty: GoalDifficulty
  estimatedDuration: string
  weeklyCommitment: number
  successMetrics: string[]
  milestones: GoalMilestone[]
  suggestedRoadmaps: string[]
  dependencies: string[]
  skillsRequired: string[]
  resources: string[]
  risks: GoalRisk[]
  opportunities: GoalOpportunity[]
  realityCheck?: string
  conflicts?: string[]
  reasoning: {
    category: string
    priority: string
    difficulty: string
    timeline: string
  }
}

export interface GoalMetadata {
  whyItMatters?: string
  category?: GoalCategory
  difficulty?: GoalDifficulty
  estimatedDuration?: string
  weeklyCommitment?: number
  successMetrics?: string[]
  milestones?: GoalMilestone[]
  suggestedRoadmaps?: string[]
  dependencies?: string[]
  skillsRequired?: string[]
  resources?: string[]
  roadmap?: string[]
  risks?: GoalRisk[]
  opportunities?: GoalOpportunity[]
  aiAnalysis?: GoalAIAnalysis
  aiAnalyzedAt?: string
  aiModel?: string
  visibility?: GoalVisibility
  tags?: string[]
  healthScore?: number
  confidenceScore?: number
  [key: string]: unknown
}

export interface Goal {
  id: string
  userId: string
  parentGoalId: string | null
  title: string
  description: string | null
  level: GoalLevel
  status: GoalStatus
  priority: number
  progress: number
  startDate: string | null
  targetDate: string | null
  completedAt: string | null
  tags: string[]
  metadata: GoalMetadata
  createdAt: string
  updatedAt: string

  children?: Goal[]
  parent?: Goal | null
}

export interface CreateGoalInput {
  title: string
  description?: string
  level?: GoalLevel
  parentGoalId?: string
  targetDate?: string
  tags?: string[]
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  level?: GoalLevel
  parentGoalId?: string | null
  targetDate?: string | null
  priority?: number
  tags?: string[]
  metadata?: Partial<GoalMetadata>
}

export interface GoalTreeNode extends Goal {
  children: GoalTreeNode[]
  depth: number
}

export interface GoalStats {
  total: number
  active: number
  completed: number
  paused: number
  cancelled: number
  byLevel: Record<GoalLevel, number>
  byCategory: Record<string, number>
  averageProgress: number
  averageHealth: number
  overdueCount: number
}

export const LEVEL_HIERARCHY: Record<GoalLevel, number> = {
  'vision': 0,
  'long-term': 1,
  'yearly': 2,
  'quarterly': 3,
  'monthly': 4,
  'weekly': 5,
}

export const STATUS_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  'draft': ['active', 'cancelled'],
  'active': ['paused', 'completed', 'cancelled'],
  'paused': ['active', 'cancelled'],
  'completed': ['active', 'archived'],
  'cancelled': ['draft', 'active'],
  'archived': [],
}

export const LEVEL_TO_PRISMA: Record<GoalLevel, string> = {
  'vision': 'vision',
  'long-term': 'long_term',
  'yearly': 'yearly',
  'quarterly': 'quarterly',
  'monthly': 'monthly',
  'weekly': 'weekly',
}

export const PRISMA_TO_LEVEL: Record<string, GoalLevel> = {
  vision: 'vision',
  long_term: 'long-term',
  yearly: 'yearly',
  quarterly: 'quarterly',
  monthly: 'monthly',
  weekly: 'weekly',
}
