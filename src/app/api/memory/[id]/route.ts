import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const existing = await prisma.aIMemory.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory not found' } }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.value !== undefined) data.value = body.value
    if (body.confidence !== undefined) data.confidence = body.confidence
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.memoryType !== undefined) data.memoryType = body.memoryType
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const memory = await prisma.aIMemory.update({ where: { id }, data })
    return NextResponse.json({ data: memory })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update memory' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.aIMemory.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory not found' } }, { status: 404 })
    }
    await prisma.aIMemory.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete memory' } }, { status: 500 })
  }
}
