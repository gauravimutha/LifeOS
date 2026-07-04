import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType')

    if (!entityId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'entityId is required' } }, { status: 400 })
    }

    const edges = await prisma.lifeGraphEdge.findMany({
      where: {
        OR: [
          { sourceEntityId: entityId, sourceEntityType: entityType ?? undefined },
          { targetEntityId: entityId, targetEntityType: entityType ?? undefined },
        ],
      } as any,
    })

    const neighbors = edges.map(edge => ({
      edgeId: edge.id,
      edgeType: edge.edgeType,
      weight: edge.weight,
      neighborId: edge.sourceEntityId === entityId ? edge.targetEntityId : edge.sourceEntityId,
      neighborType: edge.sourceEntityId === entityId ? edge.targetEntityType : edge.sourceEntityType,
      direction: edge.sourceEntityId === entityId ? 'outgoing' as const : 'incoming' as const,
    }))

    return NextResponse.json({ data: neighbors })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch neighbors' } }, { status: 500 })
  }
}
