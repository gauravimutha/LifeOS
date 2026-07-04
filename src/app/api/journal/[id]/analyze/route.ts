import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const entry = await prisma.journalEntry.findUnique({ where: { id } })
    if (!entry || entry.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Journal entry not found' } }, { status: 404 })
    }

    const analysis = {
      entryId: id,
      wordCount: entry.content.split(/\s+/).length,
      sentiment: 'neutral',
      topics: entry.tags,
      moodTrend: entry.moodBefore && entry.moodAfter ? (entry.moodAfter - entry.moodBefore) : null,
      analyzedAt: new Date().toISOString(),
    }

    return NextResponse.json({ data: analysis })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to analyze entry' } }, { status: 500 })
  }
}
