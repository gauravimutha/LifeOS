import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Check if it's a DailyAction
    const existing = await prisma.dailyAction.findUnique({ where: { id } })
    if (existing) {
      const nextStatus = existing.status === 'completed' ? 'pending' : 'completed'
      const action = await prisma.dailyAction.update({
        where: { id },
        data: { status: nextStatus },
      })
      return NextResponse.json({ data: action })
    }

    // Check if it's a RoadmapStep
    const step = await prisma.roadmapStep.findUnique({ where: { id } })
    if (step) {
      const nextCompleted = !step.isCompleted
      const updatedStep = await prisma.roadmapStep.update({
        where: { id },
        data: { isCompleted: nextCompleted, completedAt: nextCompleted ? new Date() : null },
      })
      
      // Update parent goal progress dynamically
      try {
        const { goalEngine } = await import('@/engine/goalEngine')
        const roadmap = await prisma.roadmap.findUnique({ where: { id: updatedStep.roadmapId } })
        if (roadmap?.goalId) {
          await goalEngine.calculateGoalProgress(roadmap.goalId)
        }
      } catch (err) {
        console.error('Failed to trigger goal progress update:', err)
      }

      return NextResponse.json({
        data: {
          id: updatedStep.id,
          title: updatedStep.title,
          status: updatedStep.isCompleted ? 'completed' : 'pending',
          priority: 3,
        }
      })
    }

    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action or step not found' } }, { status: 404 })
  } catch (error) {
    console.error('Failed to complete action or step:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } }, { status: 500 })
  }
}
