import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const q = searchParams.get('q')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId, isActive: true, deletedAt: null }
    if (type) where.memoryType = type
    if (q) where.key = { contains: q, mode: 'insensitive' }

    const memories = await prisma.aIMemory.findMany({ where: where as any, orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }] })
    return NextResponse.json({ data: memories })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to search memories' } }, { status: 500 })
  }
}
