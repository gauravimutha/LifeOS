import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'
import { aiClient } from '@/services/ai/client'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const type = searchParams.get('type')
    const tags = searchParams.get('tags')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const where: Record<string, unknown> = { userId: userId as string, deletedAt: null }
    if (type) where.entryType = type
    if (tags) where.tags = { hasSome: tags.split(',') }
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      where.entryDate = dateFilter
    }

    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 30
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0

    const entries = await prisma.journalEntry.findMany({
      where: where as any,
      orderBy: { entryDate: 'desc' },
      take: limit,
      skip: offset,
    })
    return NextResponse.json({ data: entries })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch journal entries' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, title, content, entryType, entryDate, tags, moodBefore, moodAfter, energyBefore, energyAfter } = body

    if (!content) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'content is required' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    // AI Analysis Generation
    let analysisJson: any = {
      sentiment: 'Neutral',
      sentimentScore: 0.5,
      themes: tags && tags.length > 0 ? tags : ['personal'],
      insights: [
        'Great job keeping a record of your thoughts. Journaling daily builds consistency and self-reflection.',
        'Review your before vs after mood logs to identify energy patterns.',
      ]
    }

    const apiKey = process.env.OPENROUTER_API_KEY || ''
    const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

    if (!isApiKeyPlaceholder) {
      try {
        const prompt = `You are LifeOS, an AI Chief of Staff.
Analyze this journal entry:
Title: "${title || 'Untitled'}"
Content: "${content}"

Analyze the sentiment, key themes (categories like work, learning, fitness), and generate 2-3 constructive self-growth insights.
Return exactly this JSON structure:
{
  "sentiment": "Positive / Neutral / Negative",
  "sentimentScore": 0.85,
  "themes": ["theme1", "theme2"],
  "insights": ["insight1", "insight2"]
}
Return ONLY raw JSON. No markdown backticks, no comments.`

        const aiResponse = await aiClient.gateway(userId, {
          taskType: 'tiny',
          prompt,
          systemPrompt: 'You are a journaling analyst returning strict JSON matching the requested schema.'
        })
        if (aiResponse) {
          const cleaned = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          analysisJson = JSON.parse(cleaned)
        }
      } catch (err) {
        console.warn('AI journal analysis failed:', err)
      }
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: userId as string,
        title: title ?? null,
        content,
        entryType: entryType ?? 'free',
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        tags: tags ?? [],
        moodBefore: moodBefore ?? null,
        moodAfter: moodAfter ?? null,
        energyBefore: energyBefore ?? null,
        energyAfter: energyAfter ?? null,
        metadata: analysisJson,
      },
    })
    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('Journal entry creation failed:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create journal entry' } }, { status: 500 })
  }
}
