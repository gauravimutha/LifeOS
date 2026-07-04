import type { EdgeType, EntityType, LifeGraphEdge, GraphData, GraphNode, GraphEdge, EdgeFilter } from '@/types/lifeGraph'
import { db } from '@/lib/db'

export const OPPOSITE_EDGES: Partial<Record<EdgeType, EdgeType>> = {
  parent_of: 'belongs_to',
  belongs_to: 'parent_of',
  depends_on: 'requires',
  requires: 'depends_on',
  blocks: 'blocks',
  precedes: 'follows',
  follows: 'precedes',
  supports: 'supports',
  conflicts_with: 'conflicts_with',
  improves: 'harms',
  harms: 'improves',
  generates: 'references',
  references: 'generates',
  measures: 'measures',
  relates_to: 'relates_to',
}

export function getOppositeEdgeType(type: EdgeType): EdgeType {
  return OPPOSITE_EDGES[type] ?? type
}

export function isDirectedEdge(type: EdgeType): boolean {
  return !['relates_to', 'conflicts_with', 'supports'].includes(type)
}

export function validateEdge(
  sourceId: string,
  targetId: string,
  sourceType: EntityType,
  targetType: EntityType,
): string | null {
  if (!sourceId || !targetId) return 'Source and target entity IDs are required'
  if (sourceId === targetId && sourceType === targetType) {
    return 'An entity cannot have an edge to itself'
  }
  return null
}

export function detectCycle(
  edges: LifeGraphEdge[],
  newEdge: { sourceEntityId: string; targetEntityId: string; edgeType: EdgeType },
): boolean {
  if (newEdge.edgeType !== 'parent_of' && newEdge.edgeType !== 'depends_on' && newEdge.edgeType !== 'requires') {
    return false
  }

  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.edgeType === 'parent_of' || edge.edgeType === 'depends_on' || edge.edgeType === 'requires') {
      const neighbors = adjacency.get(edge.sourceEntityId) ?? []
      neighbors.push(edge.targetEntityId)
      adjacency.set(edge.sourceEntityId, neighbors)
    }
  }

  const fromNeighbors = adjacency.get(newEdge.targetEntityId) ?? []
  fromNeighbors.push(newEdge.sourceEntityId)
  adjacency.set(newEdge.targetEntityId, fromNeighbors)

  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(node: string): boolean {
    if (inStack.has(node)) return true
    if (visited.has(node)) return false
    visited.add(node)
    inStack.add(node)
    const neighbors = adjacency.get(node) ?? []
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true
    }
    inStack.delete(node)
    return false
  }

  return dfs(newEdge.sourceEntityId)
}

export function extractSubgraph(
  edges: LifeGraphEdge[],
  centerEntityId: string,
  depth: number = 2,
): LifeGraphEdge[] {
  const visited = new Set<string>()
  const result: LifeGraphEdge[] = []
  let currentLevel = new Set([centerEntityId])

  for (let d = 0; d < depth; d++) {
    const nextLevel = new Set<string>()
    for (const entityId of currentLevel) {
      if (visited.has(entityId)) continue
      visited.add(entityId)
      for (const edge of edges) {
        if (edge.sourceEntityId === entityId && !visited.has(edge.targetEntityId)) {
          result.push(edge)
          nextLevel.add(edge.targetEntityId)
        }
        if (edge.targetEntityId === entityId && !visited.has(edge.sourceEntityId)) {
          result.push(edge)
          nextLevel.add(edge.sourceEntityId)
        }
      }
    }
    currentLevel = nextLevel
  }

  return result
}

export function findPathsBetween(
  edges: LifeGraphEdge[],
  fromId: string,
  toId: string,
  maxDepth: number = 5,
): LifeGraphEdge[][] {
  const adjacency = new Map<string, { edge: LifeGraphEdge; target: string }[]>()
  for (const edge of edges) {
    const from = adjacency.get(edge.sourceEntityId) ?? []
    from.push({ edge, target: edge.targetEntityId })
    adjacency.set(edge.sourceEntityId, from)

    const to = adjacency.get(edge.targetEntityId) ?? []
    to.push({ edge, target: edge.sourceEntityId })
    adjacency.set(edge.targetEntityId, to)
  }

  const paths: LifeGraphEdge[][] = []
  const visited = new Set<string>()

  function dfs(current: string, path: LifeGraphEdge[]) {
    if (path.length > maxDepth) return
    if (current === toId && path.length > 0) {
      paths.push([...path])
      return
    }
    if (visited.has(current)) return
    visited.add(current)
    const neighbors = adjacency.get(current) ?? []
    for (const { edge, target } of neighbors) {
      path.push(edge)
      dfs(target, path)
      path.pop()
    }
    visited.delete(current)
  }

  dfs(fromId, [])
  return paths
}

export function convertToGraphData(
  nodes: Map<string, { type: EntityType; label: string; data?: Record<string, unknown> }>,
  edges: LifeGraphEdge[],
): GraphData {
  const graphNodes: GraphNode[] = []
  const graphEdges: GraphEdge[] = []

  for (const [id, nodeData] of nodes) {
    graphNodes.push({
      id,
      type: nodeData.type,
      label: nodeData.label,
      data: nodeData.data ?? {},
    })
  }

  for (const edge of edges) {
    graphEdges.push({
      id: edge.id,
      source: edge.sourceEntityId,
      target: edge.targetEntityId,
      type: edge.edgeType,
      weight: edge.weight,
      directed: isDirectedEdge(edge.edgeType),
    })
  }

  return { nodes: graphNodes, edges: graphEdges }
}

export function filterEdges(edges: LifeGraphEdge[], filter: EdgeFilter): LifeGraphEdge[] {
  return edges.filter((edge) => {
    if (filter.sourceEntityType && edge.sourceEntityType !== filter.sourceEntityType) return false
    if (filter.targetEntityType && edge.targetEntityType !== filter.targetEntityType) return false
    if (filter.edgeType && edge.edgeType !== filter.edgeType) return false
    if (filter.sourceEntityId && edge.sourceEntityId !== filter.sourceEntityId) return false
    if (filter.targetEntityId && edge.targetEntityId !== filter.targetEntityId) return false
    return true
  })
}

export function groupEdgesByType(edges: LifeGraphEdge[]): Record<string, LifeGraphEdge[]> {
  const grouped: Record<string, LifeGraphEdge[]> = {}
  for (const edge of edges) {
    const key = edge.edgeType
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(edge)
  }
  return grouped
}

export function calculateConnectivity(edges: LifeGraphEdge[], entityId: string): {
  totalConnections: number
  byType: Record<string, number>
  byDirection: { outgoing: number; incoming: number }
} {
  const byType: Record<string, number> = {}
  let outgoing = 0
  let incoming = 0

  for (const edge of edges) {
    if (edge.sourceEntityId === entityId) {
      outgoing++
      byType[edge.edgeType] = (byType[edge.edgeType] ?? 0) + 1
    }
    if (edge.targetEntityId === entityId) {
      incoming++
      byType[edge.edgeType] = (byType[edge.edgeType] ?? 0) + 1
    }
  }

  return {
    totalConnections: outgoing + incoming,
    byType,
    byDirection: { outgoing, incoming },
  }
}

export const lifeGraphEngine = {
  async createEdge(
    userId: string,
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
    edgeType: EdgeType,
    weight: number = 1.0,
    metadata: Record<string, unknown> = {},
  ) {
    const edge = await db.lifeGraphEdge.create({
      data: {
        userId,
        sourceEntityType: sourceType,
        sourceEntityId: sourceId,
        targetEntityType: targetType,
        targetEntityId: targetId,
        edgeType: edgeType as any,
        weight,
        metadata: metadata as any,
      },
    })
    return edge
  },

  async getNeighbors(
    entityType: EntityType,
    entityId: string,
    options?: { direction?: 'incoming' | 'outgoing' | 'both'; edgeType?: EdgeType },
  ) {
    const where: any = { deletedAt: null }
    if (options?.direction === 'outgoing' || !options?.direction || options?.direction === 'both') {
      where.OR = [
        { sourceEntityId: entityId, sourceEntityType: entityType },
      ]
    }
    if (options?.direction === 'incoming') {
      where.OR = [{ targetEntityId: entityId, targetEntityType: entityType }]
    }
    if (options?.direction === 'both') {
      where.OR = [
        { sourceEntityId: entityId, sourceEntityType: entityType },
        { targetEntityId: entityId, targetEntityType: entityType },
      ]
    }
    if (options?.edgeType) where.edgeType = options.edgeType as any

    const edges = await db.lifeGraphEdge.findMany({ where, orderBy: { createdAt: 'desc' } })
    return edges
  },

  async traverse(entityType: EntityType, entityId: string, maxDepth: number) {
    const visited = new Set<string>()
    const nodes: Array<{ id: string; type: string; depth: number }> = []
    const edges: any[] = []
    let queue: Array<{ id: string; type: string; depth: number }> = [{ id: entityId, type: entityType, depth: 0 }]
    visited.add(`${entityType}:${entityId}`)

    while (queue.length > 0) {
      const current = queue.shift()!
      nodes.push(current)
      if (current.depth >= maxDepth) continue

      const connected = await db.lifeGraphEdge.findMany({
        where: {
          OR: [
            { sourceEntityId: current.id, sourceEntityType: current.type },
            { targetEntityId: current.id, targetEntityType: current.type },
          ],
          deletedAt: null,
        },
      })

      for (const edge of connected) {
        edges.push(edge)
        const isSource = edge.sourceEntityId === current.id && edge.sourceEntityType === current.type
        const neighborId = isSource ? edge.targetEntityId : edge.sourceEntityId
        const neighborType = isSource ? edge.targetEntityType : edge.sourceEntityType
        const key = `${neighborType}:${neighborId}`
        if (!visited.has(key)) {
          visited.add(key)
          queue.push({ id: neighborId, type: neighborType, depth: current.depth + 1 })
        }
      }
    }

    return { nodes, edges }
  },

  async removeEdgesForEntity(entityType: EntityType, entityId: string) {
    await db.lifeGraphEdge.updateMany({
      where: {
        OR: [
          { sourceEntityId: entityId, sourceEntityType: entityType },
          { targetEntityId: entityId, targetEntityType: entityType },
        ],
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    })
  },

  async getSubgraph(entityType: EntityType, entityId: string, maxDepth: number) {
    const result = await this.traverse(entityType, entityId, maxDepth)
    return result
  },

  async findPath(
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
  ) {
    const queue: Array<{
      id: string
      type: string
      path: Array<{ id: string; type: string }>
    }> = [{ id: sourceId, type: sourceType, path: [{ id: sourceId, type: sourceType }] }]
    const visited = new Set<string>()
    visited.add(`${sourceType}:${sourceId}`)

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.id === targetId && current.type === targetType) {
        return current.path
      }

      const edges = await db.lifeGraphEdge.findMany({
        where: {
          OR: [
            { sourceEntityId: current.id, sourceEntityType: current.type },
            { targetEntityId: current.id, targetEntityType: current.type },
          ],
          deletedAt: null,
        },
      })

      for (const edge of edges) {
        const isSource = edge.sourceEntityId === current.id && edge.sourceEntityType === current.type
        const neighborId = isSource ? edge.targetEntityId : edge.sourceEntityId
        const neighborType = isSource ? edge.targetEntityType : edge.sourceEntityType
        const key = `${neighborType}:${neighborId}`
        if (!visited.has(key)) {
          visited.add(key)
          queue.push({
            id: neighborId,
            type: neighborType,
            path: [...current.path, { id: neighborId, type: neighborType }],
          })
        }
      }
    }

    return null
  },
}
