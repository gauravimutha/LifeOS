import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiClient } from '@/services/ai/client'
import { verifyUser } from '@/lib/auth'
import { executeAIFeature, AIFeatureDefinition } from '@/services/ai/fallback'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'userId is required' } },
        { status: 400 }
      )
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const preferences = (user.preferences as Record<string, any>) || {}
    const routineGenerations = (preferences.routineGenerations as string[]) || []

    const now = new Date()
    const currentMonth = now.getUTCMonth()
    const currentYear = now.getUTCFullYear()

    const thisMonthGenerations = routineGenerations.filter((timestampStr) => {
      const gDate = new Date(timestampStr)
      return gDate.getUTCMonth() === currentMonth && gDate.getUTCFullYear() === currentYear
    })

    return NextResponse.json({
      data: {
        usedThisMonth: thisMonthGenerations.length,
        limit: 3,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch routine generation limits' } },
      { status: 500 }
    )
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'userId is required' } },
        { status: 400 }
      )
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // 1. Check and calculate monthly usage limit (max 3 times per calendar month)
    const preferences = (user.preferences as Record<string, any>) || {}
    const routineGenerations = (preferences.routineGenerations as string[]) || []

    const now = new Date()
    const currentMonth = now.getUTCMonth()
    const currentYear = now.getUTCFullYear()

    // Filter generations in the current calendar month
    const thisMonthGenerations = routineGenerations.filter((timestampStr) => {
      const gDate = new Date(timestampStr)
      return gDate.getUTCMonth() === currentMonth && gDate.getUTCFullYear() === currentYear
    })

    if (thisMonthGenerations.length >= 3) {
      return NextResponse.json(
        {
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'You have already generated routines 3 times this month. The limit resets at the start of next month.',
          },
          data: {
            usedThisMonth: thisMonthGenerations.length,
            limit: 3,
          }
        },
        { status: 403 }
      )
    }

    const routinesFeature: AIFeatureDefinition<any, []> = {
      name: 'Routines Generator',
      executeAI: async () => {
        const prompt = `You are a premium AI Chief of Staff and life coach.
Generate 3-4 realistic, highly-actionable daily routines suited for this user.
Return a JSON object conforming exactly to this structure:
{
  "routines": [
    {
      "title": "A title for the routine (e.g. Morning Focus, Evening Detox)",
      "description": "Brief description of the routine's purpose",
      "routineType": "morning / afternoon / evening / flexible",
      "timeOfDay": "HH:MM (e.g. 08:00, 19:30 or leave empty if flexible)",
      "durationMinutes": 60,
      "isFlexible": true,
      "steps": [
        "Actionable routine step 1",
        "Actionable routine step 2",
        "Actionable routine step 3"
      ]
    }
  ]
}

Return ONLY raw JSON. Do not include markdown backticks, markdown code block identifiers, or any conversational text.`

        const response = await aiClient.gateway(userId, {
          taskType: 'medium',
          prompt,
          systemPrompt: 'You are an assistant returning strict JSON matching the routines schema.',
        })
        const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        if (!parsed || !Array.isArray(parsed.routines)) {
          throw new Error('Invalid routines schema returned by LLM.')
        }
        return parsed
      },
      executeIntelligentFallback: async () => {
        return {
          routines: [
            {
              title: 'Morning Momentum',
              description: 'Energize your body and focus your mind for the day ahead.',
              routineType: 'morning',
              timeOfDay: '07:30',
              durationMinutes: 45,
              isFlexible: false,
              steps: [
                'Wake up and hydrate with a glass of water',
                '10-minute mindfulness meditation or breathwork',
                'Quick stretching or joint mobility routine',
                "Review today's top 3 priority tasks"
              ],
            },
            {
              title: 'Deep Work Block',
              description: 'Uninterrupted time dedicated to high-priority engineering objectives.',
              routineType: 'afternoon',
              timeOfDay: '10:00',
              durationMinutes: 120,
              isFlexible: true,
              steps: [
                'Close email, chat applications, and mute notifications',
                'Define the single focus output for the next 2 hours',
                'Execute focused work in 50-minute blocks with 10-minute breaks'
              ],
            },
            {
              title: 'Evening Wind-down',
              description: 'Disconnect from screens, reflect, and prepare for restful sleep.',
              routineType: 'evening',
              timeOfDay: '21:30',
              durationMinutes: 60,
              isFlexible: false,
              steps: [
                'Shutdown laptop and set phone to do-not-disturb mode',
                'Write down 3 wins and 1 lesson in your journal',
                'Read a non-fiction book for 15-20 minutes',
                "Plan tomorrow's schedule and select priorities"
              ],
            }
          ]
        }
      },
      executeSafeDefault: () => {
        return {
          routines: [
            {
              title: 'Daily Startup Routine',
              description: 'Core starter routine to structure your day.',
              routineType: 'morning',
              timeOfDay: '09:00',
              durationMinutes: 30,
              isFlexible: true,
              steps: ['Review priorities', 'Hydrate and stretch']
            }
          ]
        }
      }
    }

    const fallbackResponse = await executeAIFeature(routinesFeature)
    const parsedPayload = fallbackResponse.data

    // 3. Save to database in a transaction
    const createdRoutines = await prisma.$transaction(async (tx) => {
      // Soft-delete existing active routines first to prevent duplication
      await tx.routine.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date() },
      })

      const dbRoutines = []

      for (const r of parsedPayload.routines) {
        const created = await tx.routine.create({
          data: {
            userId,
            title: r.title,
            description: r.description || '',
            routineType: r.routineType || 'flexible',
            timeOfDay: r.timeOfDay || null,
            durationMinutes: r.durationMinutes || null,
            isFlexible: r.isFlexible ?? true,
            status: 'active',
            steps: {
              create: (r.steps || []).map((stepTitle: string, index: number) => ({
                title: stepTitle,
                order: index + 1,
              })),
            },
          },
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        })
        dbRoutines.push(created)
      }

      // Update user generation count log
      const updatedGenerations = [...routineGenerations, now.toISOString()]
      await tx.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...preferences,
            routineGenerations: updatedGenerations,
          },
        },
      })

      return dbRoutines
    }, {
      timeout: 15000
    })

    return NextResponse.json({
      data: {
        routines: createdRoutines,
        usedThisMonth: thisMonthGenerations.length + 1,
        limit: 3,
      },
    })
  } catch (error) {
    console.error('Routine generation route failed:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate routines' } },
      { status: 500 }
    )
  }
}
