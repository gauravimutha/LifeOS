import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId is required' } }, { status: 400 })
    }

    const edges = await prisma.lifeGraphEdge.findMany({ where: { userId, deletedAt: null } })

    const typeCounts: Record<string, number> = {}
    for (const edge of edges) {
      typeCounts[edge.edgeType] = (typeCounts[edge.edgeType] ?? 0) + 1
    }

    const entityTypes = new Set<string>()
    for (const edge of edges) {
      entityTypes.add(edge.sourceEntityType)
      entityTypes.add(edge.targetEntityType)
    }

    return NextResponse.json({
      data: {
        totalEdges: edges.length,
        totalNodes: entityTypes.size,
        edgeTypeDistribution: typeCounts,
        entityTypes: Array.from(entityTypes),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch graph stats' } }, { status: 500 })
  }
}
