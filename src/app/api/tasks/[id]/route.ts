import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const action = await prisma.dailyAction.findUnique({ where: { id } })
    if (!action) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: action })
  } catch (error) {
    console.error('Failed to get action:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch action' } }, { status: 500 })
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const existing = await prisma.dailyAction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action not found' } }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.activity = body.title
    if (body.activity !== undefined) data.activity = body.activity
    if (body.status !== undefined) data.status = body.status
    if (body.startTime !== undefined) data.startTime = new Date(body.startTime)
    if (body.endTime !== undefined) data.endTime = new Date(body.endTime)
    if (body.type !== undefined) data.type = body.type
    if (body.reason !== undefined) data.reason = body.reason

    const action = await prisma.dailyAction.update({ where: { id }, data })
    return NextResponse.json({ data: action })
  } catch (error) {
    console.error('Failed to update action:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update action' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.dailyAction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action not found' } }, { status: 404 })
    }
    await prisma.dailyAction.delete({ where: { id } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('Failed to delete action:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete action' } }, { status: 500 })
  }
}
