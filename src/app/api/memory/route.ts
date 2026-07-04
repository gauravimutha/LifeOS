import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const where: Record<string, unknown> = { userId, isActive: true, deletedAt: null }
    if (type) where.memoryType = type

    const memories = await prisma.aIMemory.findMany({ where: where as any, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: memories })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch memories' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, memoryType, key, value, confidence, expiresAt } = body

    if (!memoryType || !key || value === undefined) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'memoryType, key, and value are required' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const memory = await prisma.aIMemory.upsert({
      where: { userId_key: { userId, key } },
      update: { value, memoryType, confidence: confidence ?? 1.0, expiresAt: expiresAt ? new Date(expiresAt) : null },
      create: { userId, memoryType, key, value, confidence: confidence ?? 1.0, expiresAt: expiresAt ? new Date(expiresAt) : null },
    })
    return NextResponse.json({ data: memory }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to store memory' } }, { status: 500 })
  }
}
