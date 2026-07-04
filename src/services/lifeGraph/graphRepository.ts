import type { LifeGraphEdge, EdgeType, EntityType, EdgeFilter } from '@/types/lifeGraph'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function serializeEdge(edge: PrismaLifeGraphEdge): LifeGraphEdge {
  return {
    id: edge.id,
    userId: edge.userId,
    sourceEntityId: edge.sourceEntityId,
    sourceEntityType: edge.sourceEntityType as EntityType,
    targetEntityId: edge.targetEntityId,
    targetEntityType: edge.targetEntityType as EntityType,
    edgeType: edge.edgeType as EdgeType,
    weight: edge.weight,
    metadata: edge.metadata as Record<string, unknown>,
    createdAt: edge.createdAt.toISOString(),
    updatedAt: edge.updatedAt.toISOString(),
  }
}

type PrismaLifeGraphEdge = NonNullable<Awaited<ReturnType<typeof prisma.lifeGraphEdge.findFirst>>>

export const graphRepository = {
  async createEdge(data: {
    userId: string
    sourceEntityId: string
    sourceEntityType: EntityType
    targetEntityId: string
    targetEntityType: EntityType
    edgeType: EdgeType
    weight?: number
    metadata?: Record<string, unknown>
  }): Promise<LifeGraphEdge> {
    const edge = await prisma.lifeGraphEdge.create({
      data: {
        userId: data.userId,
        sourceEntityId: data.sourceEntityId,
        sourceEntityType: data.sourceEntityType,
        targetEntityId: data.targetEntityId,
        targetEntityType: data.targetEntityType,
        edgeType: data.edgeType as any,
        weight: data.weight ?? 1.0,
        metadata: (data.metadata ?? {}) as any,
      },
    })
    return serializeEdge(edge)
  },

  async deleteEdge(id: string): Promise<void> {
    await prisma.lifeGraphEdge.update({ where: { id }, data: { deletedAt: new Date() } })
  },

  async hardDeleteEdge(id: string): Promise<void> {
    await prisma.lifeGraphEdge.delete({ where: { id } })
  },

  async getEdgesForEntity(entityId: string, entityType: EntityType): Promise<LifeGraphEdge[]> {
    const edges = await prisma.lifeGraphEdge.findMany({
      where: {
        OR: [
          { sourceEntityId: entityId, sourceEntityType: entityType },
          { targetEntityId: entityId, targetEntityType: entityType },
        ],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
    return edges.map(serializeEdge)
  },

  async getConnectedEntities(
    entityId: string,
    entityType: EntityType,
  ): Promise<{ edge: LifeGraphEdge; connectedEntityId: string; connectedEntityType: EntityType }[]> {
    const edges = await this.getEdgesForEntity(entityId, entityType)
    return edges.map((edge) => {
      const isSource = edge.sourceEntityId === entityId && edge.sourceEntityType === entityType
      return {
        edge,
        connectedEntityId: isSource ? edge.targetEntityId : edge.sourceEntityId,
        connectedEntityType: isSource ? edge.targetEntityType : edge.sourceEntityType,
      }
    })
  },

  async getEdgesByType(userId: string, edgeType: EdgeType): Promise<LifeGraphEdge[]> {
    const edges = await prisma.lifeGraphEdge.findMany({
      where: { userId, edgeType: edgeType as any, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return edges.map(serializeEdge)
  },

  async getEdges(userId: string, filter?: EdgeFilter): Promise<LifeGraphEdge[]> {
    const where: Prisma.LifeGraphEdgeWhereInput = { userId, deletedAt: null }
    if (filter?.sourceEntityType) where.sourceEntityType = filter.sourceEntityType
    if (filter?.targetEntityType) where.targetEntityType = filter.targetEntityType
    if (filter?.edgeType) where.edgeType = filter.edgeType as any
    if (filter?.sourceEntityId) where.sourceEntityId = filter.sourceEntityId
    if (filter?.targetEntityId) where.targetEntityId = filter.targetEntityId

    const edges = await prisma.lifeGraphEdge.findMany({ where, orderBy: { createdAt: 'desc' } })
    return edges.map(serializeEdge)
  },

  async getAllEdges(userId: string): Promise<LifeGraphEdge[]> {
    const edges = await prisma.lifeGraphEdge.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return edges.map(serializeEdge)
  },

  async getEdgeBetween(
    sourceEntityId: string,
    targetEntityId: string,
    edgeType?: EdgeType,
  ): Promise<LifeGraphEdge | null> {
    const where: Prisma.LifeGraphEdgeWhereInput = {
      OR: [
        { sourceEntityId, targetEntityId },
        { sourceEntityId: targetEntityId, targetEntityId: sourceEntityId },
      ],
      deletedAt: null,
    }
    if (edgeType) where.edgeType = edgeType as any

    const edge = await prisma.lifeGraphEdge.findFirst({ where })
    return edge ? serializeEdge(edge) : null
  },
}
