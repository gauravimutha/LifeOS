import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.dailyAction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action not found' } }, { status: 404 })
    }

    const action = await prisma.dailyAction.update({
      where: { id },
      data: { status: 'skipped' },
    })
    return NextResponse.json({ data: action })
  } catch (error) {
    console.error('Failed to defer action:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update action status' } }, { status: 500 })
  }
}
