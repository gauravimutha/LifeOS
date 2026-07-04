export const EDGE_TYPES = [
  'parent_of',
  'supports',
  'depends_on',
  'relates_to',
  'blocks',
  'precedes',
  'follows',
  'conflicts_with',
  'improves',
  'harms',
  'requires',
  'generates',
  'measures',
  'belongs_to',
  'references',
] as const

export type EdgeType = (typeof EDGE_TYPES)[number]

export const EDGE_CATEGORIES: Record<string, EdgeType[]> = {
  hierarchical: ['parent_of', 'belongs_to'],
  dependency: ['depends_on', 'requires', 'blocks'],
  temporal: ['precedes', 'follows'],
  relationship: ['supports', 'relates_to', 'conflicts_with', 'improves', 'harms'],
  generative: ['generates', 'measures', 'references'],
}

export const ENTITY_TYPES = [
  'goal',
  'project',
  'task',
  'habit',
  'routine',
  'journal_entry',
  'health_data',
  'relationship',
  'calendar_event',
] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

export interface LifeGraphEdge {
  id: string
  userId: string
  sourceEntityId: string
  sourceEntityType: EntityType
  targetEntityId: string
  targetEntityType: EntityType
  edgeType: EdgeType
  weight: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface GraphNode<T = Record<string, unknown>> {
  id: string
  type: EntityType
  label: string
  data: T
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number
  directed: boolean
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface EdgeFilter {
  sourceEntityType?: EntityType
  targetEntityType?: EntityType
  edgeType?: EdgeType
  sourceEntityId?: string
  targetEntityId?: string
}
