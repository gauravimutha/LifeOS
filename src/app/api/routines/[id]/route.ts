import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const routine = await prisma.routine.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
    if (!routine || routine.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Routine not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: routine })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch routine' } }, { status: 500 })
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const existing = await prisma.routine.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Routine not found' } }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.routineType !== undefined) data.routineType = body.routineType
    if (body.timeOfDay !== undefined) data.timeOfDay = body.timeOfDay
    if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes
    if (body.isFlexible !== undefined) data.isFlexible = body.isFlexible
    if (body.status !== undefined) data.status = body.status

    const routine = await prisma.routine.update({ where: { id }, data })
    return NextResponse.json({ data: routine })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update routine' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.routine.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Routine not found' } }, { status: 404 })
    }
    await prisma.routine.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete routine' } }, { status: 500 })
  }
}
