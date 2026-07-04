import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { roadmapService } from '@/services/roadmap.service'
import { verifyUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const goal = await prisma.goal.findUnique({
      where: { id }
    })

    if (!goal || goal.deletedAt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      )
    }

    // Verify authentication
    const authResult = await verifyUser(req, goal.userId)
    if (authResult.error) return authResult.error

    // Delete existing roadmaps and steps for this goal to do a clean overwrite (adaptive replanning!)
    const existingRoadmaps = await prisma.roadmap.findMany({
      where: { goalId: id }
    })
    
    if (existingRoadmaps.length > 0) {
      const roadmapIds = existingRoadmaps.map((r) => r.id)
      await prisma.$transaction([
        prisma.roadmapStep.deleteMany({
          where: { roadmapId: { in: roadmapIds } }
        }),
        prisma.roadmap.deleteMany({
          where: { id: { in: roadmapIds } }
        })
      ])
    }

    // Generate new AI roadmap and milestones
    const result = await roadmapService.generateRoadmapForGoal(id, goal.userId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'AI_ERROR', message: result.error || 'Failed to generate AI roadmap' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { message: 'Roadmap generated successfully' } })
  } catch (error) {
    console.error('Failed to regenerate roadmap:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to regenerate roadmap' } },
      { status: 500 }
    )
  }
}
