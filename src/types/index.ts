export type LifeDomain =
  | 'health'
  | 'career'
  | 'learning'
  | 'relationships'
  | 'finance'
  | 'creativity'
  | 'home'
  | 'spirituality'
  | 'adventure'

export type GoalLevel = 'vision' | 'long_term' | 'yearly' | 'quarterly' | 'monthly' | 'weekly'

export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived'

export type TaskStatus =
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'cancelled'

export type TaskSource = 'manual' | 'ai_suggested' | 'ai_generated' | 'routine' | 'habit' | 'recurring'

export type HabitType = 'build' | 'quit' | 'track'

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom' | 'interval'

export type RoutineType =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'work'
  | 'focus'
  | 'creative'
  | 'exercise'
  | 'learning'
  | 'social'
  | 'custom'

export type LifeMode =
  | 'normal'
  | 'travel'
  | 'recovery'
  | 'focus'
  | 'family'
  | 'holiday'
  | 'deep_work'
  | 'transition'
  | 'emergency'

export type EdgeType =
  | 'parent_of'
  | 'supports'
  | 'depends_on'
  | 'relates_to'
  | 'blocks'
  | 'precedes'
  | 'follows'
  | 'conflicts_with'
  | 'improves'
  | 'harms'
  | 'requires'
  | 'generates'
  | 'measures'
  | 'belongs_to'
  | 'references'

export type AIMemoryType = 'fact' | 'preference' | 'pattern' | 'context' | 'decision' | 'feedback' | 'insight' | 'learning'
