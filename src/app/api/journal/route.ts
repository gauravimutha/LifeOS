import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'
import { aiClient } from '@/services/ai/client'
import { executeAIFeature, AIFeatureDefinition } from '@/services/ai/fallback'

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

    const journalAnalysisFeature: AIFeatureDefinition<{ sentiment: string; sentimentScore: number; themes: string[]; insights: string[] }, []> = {
      name: 'Journal Entry Analyzer',
      executeAI: async () => {
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
        const response = await aiClient.gateway(userId, {
          taskType: 'tiny',
          prompt,
          systemPrompt: 'You are a journaling analyst returning strict JSON matching the requested schema.'
        })
        const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return {
          sentiment: parsed.sentiment || 'Neutral',
          sentimentScore: parsed.sentimentScore || 0.5,
          themes: parsed.themes || ['personal'],
          insights: parsed.insights || []
        }
      },
      executeIntelligentFallback: async () => {
        const contentLower = content.toLowerCase()
        let sentiment = 'Neutral'
        let sentimentScore = 0.5
        const themes: string[] = tags && tags.length > 0 ? [...tags] : []

        if (contentLower.match(/happy|great|glad|awesome|proud|good|success/)) {
          sentiment = 'Positive'
          sentimentScore = 0.8
        } else if (contentLower.match(/sad|bad|tired|stressed|exhausted|fail|difficult/)) {
          sentiment = 'Negative'
          sentimentScore = 0.2
        }

        if (contentLower.match(/code|dsa|gate|study|learn|book|class|read/)) {
          if (!themes.includes('learning')) themes.push('learning')
        }
        if (contentLower.match(/gym|workout|run|fit|exercise|diet|lift/)) {
          if (!themes.includes('fitness')) themes.push('fitness')
        }
        if (themes.length === 0) {
          themes.push('personal')
        }

        const insights = [
          `Logged a ${sentiment.toLowerCase()}-toned reflection. Consistently expressing feelings supports long-term emotional regulation.`,
          themes.includes('learning')
            ? 'Noticed focus themes on learning. Keep protective study blocks scheduled to ensure continuous progress.'
            : 'Consider logging specific daily wins to build execution momentum.'
        ]

        return {
          sentiment,
          sentimentScore,
          themes,
          insights
        }
      },
      executeSafeDefault: () => {
        return {
          sentiment: 'Neutral',
          sentimentScore: 0.5,
          themes: tags && tags.length > 0 ? tags : ['personal'],
          insights: [
            'Great job keeping a record of your thoughts. Journaling daily builds consistency and self-reflection.',
            'Review your before vs after mood logs to identify energy patterns.'
          ]
        }
      }
    }

    const fallbackResponse = await executeAIFeature(journalAnalysisFeature)
    const analysisJson = fallbackResponse.data

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
