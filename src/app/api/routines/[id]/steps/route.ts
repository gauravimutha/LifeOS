import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const { title, description, durationMinutes } = body

    if (!title) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } }, { status: 400 })
    }

    const routine = await prisma.routine.findUnique({ where: { id } })
    if (!routine || routine.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Routine not found' } }, { status: 404 })
    }

    const lastStep = await prisma.routineStep.findFirst({
      where: { routineId: id },
      orderBy: { order: 'desc' },
    })

    const step = await prisma.routineStep.create({
      data: {
        routineId: id,
        title,
        description: description ?? null,
        durationMinutes: durationMinutes ?? null,
        order: (lastStep?.order ?? 0) + 1,
      },
    })
    return NextResponse.json({ data: step }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add step' } }, { status: 500 })
  }
}
