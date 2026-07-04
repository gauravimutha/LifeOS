import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const entry = await prisma.journalEntry.findUnique({ where: { id } })
    if (!entry || entry.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Journal entry not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: entry })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch journal entry' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.journalEntry.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Journal entry not found' } }, { status: 404 })
    }
    await prisma.journalEntry.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove journal entry' } }, { status: 500 })
  }
}
