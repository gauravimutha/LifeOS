import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: habit })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch habit' } }, { status: 500 })
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const existing = await prisma.habit.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.habitType !== undefined) data.habitType = body.habitType
    if (body.frequency !== undefined) data.frequency = body.frequency
    if (body.goalId !== undefined) data.goalId = body.goalId
    if (body.status !== undefined) data.status = body.status

    const habit = await prisma.habit.update({ where: { id }, data })
    return NextResponse.json({ data: habit })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update habit' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.habit.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, { status: 404 })
    }
    await prisma.habit.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete habit' } }, { status: 500 })
  }
}
