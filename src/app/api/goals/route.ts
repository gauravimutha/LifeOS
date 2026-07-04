import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const level = searchParams.get('level')
    const status = searchParams.get('status')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const where: Record<string, unknown> = { userId, deletedAt: null }
    if (level) where.level = level
    if (status) where.status = status

    const goals = await prisma.goal.findMany({ where: where as any, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: goals })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch goals' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, title, description, level, parentGoalId, targetDate, tags } = body

    if (!title) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    let goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        level: level ?? 'long_term',
        parentGoalId: parentGoalId ?? null,
        targetDate: targetDate ? new Date(targetDate) : null,
        tags: tags ?? [],
        metadata: {},
      },
    })

    // Run AI analysis automatically on creation!
    try {
      const { goalAnalysisService } = await import('@/services/ai/goalAnalysisService')
      const { PRISMA_TO_LEVEL } = await import('@/types/goal')

      const serializedGoalForAnalysis = {
        ...goal,
        level: PRISMA_TO_LEVEL[goal.level] ?? 'long-term',
        status: goal.status.toLowerCase() as any,
        startDate: goal.startDate?.toISOString() ?? null,
        targetDate: goal.targetDate?.toISOString() ?? null,
        completedAt: goal.completedAt?.toISOString() ?? null,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        metadata: (goal.metadata ?? {}) as any,
      }

      const { analysis } = await goalAnalysisService.analyzeGoal(serializedGoalForAnalysis)
      if (analysis) {
        const metadata = {
          aiAnalysis: analysis,
          category: analysis.category,
          difficulty: analysis.difficulty,
          estimatedDuration: analysis.estimatedDuration,
          weeklyCommitment: analysis.weeklyCommitment,
          successMetrics: analysis.successMetrics,
          milestones: analysis.milestones,
          suggestedRoadmaps: analysis.suggestedRoadmaps,
          dependencies: analysis.dependencies,
          skillsRequired: analysis.skillsRequired,
          resources: analysis.resources,
          risks: analysis.risks,
          opportunities: analysis.opportunities,
          aiAnalyzedAt: new Date().toISOString(),
          aiModel: 'openai/gpt-4o-mini',
        }

        goal = await prisma.goal.update({
          where: { id: goal.id },
          data: { metadata: metadata as any },
        })
      }
    } catch (err) {
      console.warn('AI goal analysis failed on creation:', err)
    }

    // Generate AI Roadmap & Roadmap Steps (tasks) for the new goal automatically!
    try {
      const { roadmapService } = await import('@/services/roadmap.service')
      await roadmapService.generateRoadmapForGoal(goal.id, userId)
    } catch (err) {
      console.warn('AI roadmap generation failed on creation:', err)
    }

    return NextResponse.json({ data: goal }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create goal' } }, { status: 500 })
  }
}
