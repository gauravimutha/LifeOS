import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()

    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal || goal.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, { status: 404 })
    }

    const subGoals = body.subGoals as { title: string; description?: string; level?: string; targetDate?: string }[]

    if (!subGoals || !Array.isArray(subGoals) || subGoals.length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'subGoals array is required' } }, { status: 400 })
    }

    const created = await Promise.all(
      subGoals.map((sg) =>
        prisma.goal.create({
          data: {
            userId: goal.userId,
            parentGoalId: id,
            title: sg.title,
            description: sg.description ?? null,
            level: (sg.level ?? 'weekly') as any,
            targetDate: sg.targetDate ? new Date(sg.targetDate) : null,
          },
        })
      )
    )

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to decompose goal' } }, { status: 500 })
  }
}
