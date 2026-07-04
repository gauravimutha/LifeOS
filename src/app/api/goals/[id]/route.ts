import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal || goal.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: goal })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch goal' } }, { status: 500 })
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const existing = await prisma.goal.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.level !== undefined) data.level = body.level
    if (body.parentGoalId !== undefined) data.parentGoalId = body.parentGoalId
    if (body.targetDate !== undefined) data.targetDate = body.targetDate ? new Date(body.targetDate) : null
    if (body.priority !== undefined) data.priority = body.priority
    if (body.tags !== undefined) data.tags = body.tags
    if (body.status !== undefined) data.status = body.status

    const goal = await prisma.goal.update({ where: { id }, data })
    return NextResponse.json({ data: goal })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update goal' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.goal.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, { status: 404 })
    }
    await prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete goal' } }, { status: 500 })
  }
}
