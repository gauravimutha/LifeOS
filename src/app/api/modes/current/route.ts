import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 })
    }

    const memory = await prisma.aIMemory.findUnique({
      where: { userId_key: { userId, key: 'current_mode' } },
    })

    return NextResponse.json({
      data: { mode: (memory?.value as string) ?? 'normal', updatedAt: memory?.updatedAt?.toISOString() ?? null },
    })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch current mode' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, mode } = body

    if (!userId || !mode) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId and mode are required' } }, { status: 400 })
    }

    const memory = await prisma.aIMemory.upsert({
      where: { userId_key: { userId, key: 'current_mode' } },
      update: { value: mode, memoryType: 'preference' },
      create: { userId, key: 'current_mode', value: mode, memoryType: 'preference' },
    })

    return NextResponse.json({ data: { mode: memory.value, updatedAt: memory.updatedAt.toISOString() } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to set mode' } }, { status: 500 })
  }
}
