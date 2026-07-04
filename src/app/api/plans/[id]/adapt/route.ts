import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const { suggestion } = body

    const action = await prisma.dailyAction.findUnique({ where: { id } })
    if (!action) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action not found' } }, { status: 404 })
    }

    const updated = await prisma.dailyAction.update({
      where: { id },
      data: {
        startTime: suggestion?.scheduledStart ? new Date(suggestion.scheduledStart) : action.startTime,
        endTime: suggestion?.scheduledEnd ? new Date(suggestion.scheduledEnd) : action.endTime,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to adapt action:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to adapt plan' } }, { status: 500 })
  }
}
