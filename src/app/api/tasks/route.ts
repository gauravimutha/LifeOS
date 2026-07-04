import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const goalId = searchParams.get('goalId')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    if (goalId) {
      const steps = await prisma.roadmapStep.findMany({
        where: {
          roadmap: { goalId }
        },
        orderBy: { order: 'asc' }
      })
      const mapped = steps.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.isCompleted ? 'completed' : 'pending',
        priority: 3,
        createdAt: s.createdAt.toISOString()
      }))
      return NextResponse.json({ data: mapped })
    }

    // Default: return all incomplete roadmap steps across all user's active goals
    const steps = await prisma.roadmapStep.findMany({
      where: {
        roadmap: { userId: userId as string, status: 'active' },
        isCompleted: false
      },
      orderBy: { order: 'asc' }
    })
    const mapped = steps.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      status: 'pending',
      priority: 3,
      createdAt: s.createdAt.toISOString()
    }))
    return NextResponse.json({ data: mapped })
  } catch (error) {
    console.error('Failed to get tasks/steps:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch steps' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, title, description, goalId } = body

    if (!title) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    // Find or create a Roadmap to associate the step with
    let targetRoadmapId: string

    if (goalId) {
      let roadmap = await prisma.roadmap.findFirst({
        where: { goalId }
      })
      if (!roadmap) {
        roadmap = await prisma.roadmap.create({
          data: {
            userId: userId!,
            goalId,
            title: 'Strategic Execution',
            description: 'AI Generated Goal Pathway',
            status: 'active'
          }
        })
      }
      targetRoadmapId = roadmap.id
    } else {
      // Find default inbox goal/roadmap
      let inboxGoal = await prisma.goal.findFirst({
        where: { userId, title: 'Personal Inbox' }
      })
      if (!inboxGoal) {
        inboxGoal = await prisma.goal.create({
          data: {
            userId: userId!,
            title: 'Personal Inbox',
            description: 'Miscellaneous milestones and custom entries',
            level: 'long_term',
            priority: 1
          }
        })
      }
      let roadmap = await prisma.roadmap.findFirst({
        where: { goalId: inboxGoal.id }
      })
      if (!roadmap) {
        roadmap = await prisma.roadmap.create({
          data: {
            userId: userId!,
            goalId: inboxGoal.id,
            title: 'Inbox Tasks',
            description: 'Custom added items',
            status: 'active'
          }
        })
      }
      targetRoadmapId = roadmap.id
    }

    const stepCount = await prisma.roadmapStep.count({
      where: { roadmapId: targetRoadmapId }
    })

    const step = await prisma.roadmapStep.create({
      data: {
        roadmapId: targetRoadmapId,
        title,
        description: description ?? '',
        order: stepCount + 1,
        isCompleted: false
      }
    })

    // Map to legacy Task structure
    const mapped = {
      id: step.id,
      title: step.title,
      description: step.description,
      status: 'pending',
      priority: 3,
      createdAt: step.createdAt.toISOString()
    }

    return NextResponse.json({ data: mapped }, { status: 201 })
  } catch (error) {
    console.error('Failed to create step:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create step' } }, { status: 500 })
  }
}
