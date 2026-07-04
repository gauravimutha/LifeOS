import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  try {
    const { id, stepId } = await params
    const step = await prisma.routineStep.findUnique({ where: { id: stepId } })
    if (!step || step.routineId !== id) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Step not found' } }, { status: 404 })
    }
    await prisma.routineStep.delete({ where: { id: stepId } })
    return NextResponse.json({ data: { id: stepId } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove step' } }, { status: 500 })
  }
}
