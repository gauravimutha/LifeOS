import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiClient } from '@/services/ai/client'
import { verifyUser } from '@/lib/auth'
import { planningService } from '@/services/planning.service'
import { executeAIFeature, AIFeatureDefinition } from '@/services/ai/fallback'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    if (!date) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'date is required' } }, { status: 400 })
    }

    const reviewDate = new Date(date)
    reviewDate.setHours(0, 0, 0, 0)

    const review = await prisma.dailyReview.findUnique({
      where: { userId_date: { userId: userId as string, date: reviewDate } },
    })

    if (!review) {
      // Find the daily plan and actions for the target date
      const plan = await prisma.dailyPlan.findFirst({
        where: { userId: userId as string, date: reviewDate },
        include: { actions: true }
      })

      const actions = plan?.actions || []
      const completedCount = actions.filter((t) => t.status === 'completed').length
      const avgProductivity = completedCount > 0 ? Math.round((completedCount / Math.max(actions.length, 1)) * 10) : null

      const computed = {
        id: '',
        userId: userId as string,
        date: reviewDate,
        completed: `${completedCount} actions completed`,
        blocked: actions.length === 0 ? 'No actions scheduled' : `${actions.length - completedCount} skipped/pending`,
        productivity: avgProductivity ?? 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return NextResponse.json({ data: computed })
    }

    return NextResponse.json({ data: review })
  } catch (error) {
    console.error('GET daily review failed:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch daily review' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, date, completed, blocked, productivity } = body

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    if (!date) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'date is required' } }, { status: 400 })
    }

    const reviewDate = new Date(date)
    reviewDate.setHours(0, 0, 0, 0)

    // Extract Reflection Details & AI Memory update
    let wins: string[] = []
    let problems: string[] = []
    let lesson = 'Emphasize focus intervals'
    let mood = 'good'

    const dailyReviewFeature: AIFeatureDefinition<{ wins: string[]; problems: string[]; lesson: string; mood: string }, []> = {
      name: 'Daily Review Reflection Extractor',
      executeAI: async () => {
        if (!completed) throw new Error('No completed tasks provided for extraction.')
        const prompt = `Based on the user's daily reflection log:
Completed: "${completed}"
Blocked/Challenges: "${blocked || 'none'}"
Productivity Score: ${productivity || 5}

Analyze the logs and return a valid JSON object matching this structure:
{
  "wins": ["bullet points of accomplishments"],
  "problems": ["bullet points of blockers or distractions"],
  "lesson": "one main strategic execution lesson learned",
  "mood": "great/good/okay/difficult/exhausting"
}
Output ONLY raw JSON.`
        const response = await aiClient.gateway(userId, {
          taskType: 'medium',
          prompt,
          systemPrompt: 'You are a reflective AI Chief of Staff helping analyze daily journals.'
        })
        const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return {
          wins: parsed.wins || [],
          problems: parsed.problems || [],
          lesson: parsed.lesson || lesson,
          mood: parsed.mood || mood
        }
      },
      executeIntelligentFallback: async () => {
        const localWins = completed ? completed.split(/[.,;\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 3).slice(0, 3) : ['Accomplished scheduled routines']
        const localProblems = blocked ? blocked.split(/[.,;\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 3).slice(0, 2) : []
        let localMood = 'good'
        let localLesson = 'Emphasize focus intervals'

        if (productivity >= 8) {
          localMood = 'great'
          localLesson = 'Locked-in focus routines preserve mental energy.'
        } else if (productivity >= 6) {
          localMood = 'good'
          localLesson = 'Regular buffer breaks sustain productivity across tasks.'
        } else if (productivity >= 4) {
          localMood = 'okay'
          localLesson = 'Minimize distractions during deep focus periods.'
        } else {
          localMood = 'difficult'
          localLesson = 'Schedule recovery windows to avoid burnout.'
        }

        return {
          wins: localWins,
          problems: localProblems,
          lesson: localLesson,
          mood: localMood
        }
      },
      executeSafeDefault: () => {
        return {
          wins: ['Accomplished daily focus routines'],
          problems: [],
          lesson: 'Maintained scheduled focus blocks',
          mood: 'good'
        }
      }
    }

    const fallbackResponse = await executeAIFeature(dailyReviewFeature)
    const result = fallbackResponse.data
    wins = result.wins
    problems = result.problems
    lesson = result.lesson
    mood = result.mood


    // Update AI Memories in parallel
    Promise.resolve().then(async () => {
      try {
        if (wins.length > 0) {
          await prisma.aIMemory.upsert({
            where: { userId_key: { userId: userId as string, key: 'user.patterns.recent_win' } },
            create: { userId: userId as string, memoryType: 'pattern', key: 'user.patterns.recent_win', value: { text: wins[0] }, confidence: 0.9 },
            update: { value: { text: wins[0] }, updatedAt: new Date() }
          })
        }
        if (lesson) {
          await prisma.aIMemory.upsert({
            where: { userId_key: { userId: userId as string, key: 'user.patterns.lesson_learned' } },
            create: { userId: userId as string, memoryType: 'pattern', key: 'user.patterns.lesson_learned', value: { text: lesson }, confidence: 0.95 },
            update: { value: { text: lesson }, updatedAt: new Date() }
          })
        }
        if (problems.length > 0) {
          await prisma.aIMemory.upsert({
            where: { userId_key: { userId: userId as string, key: 'user.patterns.distraction' } },
            create: { userId: userId as string, memoryType: 'pattern', key: 'user.patterns.distraction', value: { text: problems[0] }, confidence: 0.8 },
            update: { value: { text: problems[0] }, updatedAt: new Date() }
          })
        }
      } catch (memError) {
        console.error('[Background Worker] Failed to save AI memories during daily review:', memError)
      }
    })

    // Structured metadata storage within completed/blocked text fields
    const completedVal = completed || wins.join('. ')
    const blockedVal = blocked || (problems.length > 0 ? problems.join('. ') : 'None')

    const review = await prisma.dailyReview.upsert({
      where: { userId_date: { userId: userId as string, date: reviewDate } },
      create: {
        userId: userId as string,
        date: reviewDate,
        completed: completedVal,
        blocked: blockedVal,
        productivity: productivity ?? null,
      },
      update: {
        completed: completedVal,
        blocked: blockedVal,
        productivity: productivity ?? null,
      },
    })

    // Invoke EOD Review to archive actions to execution history and trigger learning engine
    const productivityMap: Record<string, number> = { great: 5, good: 4, okay: 3, difficult: 2, exhausting: 1 }
    const energyLevel = productivityMap[mood] || 3

    await planningService.submitDayReview(userId, date, {
      mood: productivity ?? 5,
      energy: energyLevel,
      notes: completedVal + ' | ' + blockedVal,
      interruptions: blockedVal
    })

    return NextResponse.json({ data: review })
  } catch (error) {
    console.error('Failed to save daily review:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to save daily review' } }, { status: 500 })
  }
}
