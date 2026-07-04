import { NextRequest, NextResponse } from 'next/server'
import { planningService } from '@/services/planning.service'
import { isRateLimited } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'
import { aiClient } from '@/services/ai/client'
import { verifyUser } from '@/lib/auth'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, type, date, optimizeType, customRequest } = body

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    if (userId && isRateLimited(userId, 15)) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please try again in a minute.' } },
        { status: 429 }
      )
    }

    if (!type) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'type is required' } }, { status: 400 })
    }

    if (type !== 'daily' && type !== 'weekly') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'type must be daily or weekly' } }, { status: 400 })
    }

    const targetDate = date ? date : new Date().toISOString().split('T')[0]

    let plan: any

    const apiKey = process.env.OPENROUTER_API_KEY || ''
    const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

    if (customRequest && !isApiKeyPlaceholder) {
      try {
        const [steps, habits, events] = await Promise.all([
          prisma.roadmapStep.findMany({ where: { roadmap: { userId }, isCompleted: false } }),
          prisma.habit.findMany({ where: { userId, status: 'active' } }),
          prisma.calendarEvent.findMany({
            where: { userId, deletedAt: null },
            orderBy: { startTime: 'asc' },
          }),
        ])

        const prompt = `You are LifeOS, an AI Chief of Staff.
The user wants to generate a daily plan for ${targetDate} with this custom request: "${customRequest}".

Prioritized roadmap steps available: ${JSON.stringify(steps.map(s => ({ id: s.id, title: s.title })))}
Habits available: ${JSON.stringify(habits.map(h => h.title))}
Events: ${JSON.stringify(events.map(e => ({ title: e.title, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString() })))}

Create a personalized schedule (JSON) consisting of 4-8 time blocks for the day. Conform exactly to this JSON schema:
{
  "blocks": [
    {
      "startTime": "ISO date string (e.g. 2026-07-04T09:00:00.000Z)",
      "endTime": "ISO date string (e.g. 2026-07-04T11:00:00.000Z)",
      "activity": "activity name",
      "type": "one of: task, routine, meeting, break, fitness, personal, recovery",
      "reason": "Why this block is scheduled now/duration/priority",
      "roadmapStepId": "associated step ID if applicable"
    }
  ],
  "summary": "Brief summary explanation of the plan (1 sentence)"
}
Return ONLY raw JSON.`

        const aiResponse = await aiClient.gateway(userId, {
          taskType: 'medium',
          prompt,
          systemPrompt: 'You are a scheduling assistant returning strict JSON matching the requested schema.'
        })
        if (aiResponse) {
          const cleaned = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const parsed = JSON.parse(cleaned)
          if (parsed && parsed.blocks) {
            plan = {
              id: `daily-${targetDate}-custom`,
              userId,
              horizon: 'daily',
              date: targetDate,
              blocks: parsed.blocks,
              summary: parsed.summary || 'Custom schedule planned.',
              createdAt: new Date().toISOString(),
            }
          }
        }
      } catch (err) {
        console.warn('AI custom request planning failed, falling back to local:', err)
      }
    }

    if (!plan) {
      if (optimizeType) {
        const adapted = await planningService.adaptPlan(userId, { type: optimizeType })
        plan = {
          ...adapted,
          blocks: adapted.actions.map(a => ({
            startTime: a.startTime,
            endTime: a.endTime,
            activity: a.activity,
            type: a.type,
            taskId: a.id,
            completed: a.status === 'completed',
            reason: a.reason,
            roadmapStepId: a.roadmapStepId
          }))
        }
      } else {
        if (type === 'weekly') {
          plan = await planningService.generateWeeklyPlan(userId, targetDate)
        } else {
          const generated = await planningService.generateDailyPlan(userId, targetDate)
          plan = {
            ...generated,
            blocks: generated.actions.map(a => ({
              startTime: a.startTime,
              endTime: a.endTime,
              activity: a.activity,
              type: a.type,
              taskId: a.id,
              completed: a.status === 'completed',
              reason: a.reason,
              roadmapStepId: a.roadmapStepId
            }))
          }
        }
      }
    }

    // Fetch user preferences for personalized explanation context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    })
    const userPref = (user?.preferences as Record<string, any>) || {}
    const userStage = userPref.lifeStage || 'unspecified life stage'
    const focusedHours = userPref.focusedHours || 'standard hours'

    let explanation = `I have organized your schedule for ${targetDate}. Heavy deep work has been scheduled during your peak focus periods based on your energy profile, with buffers allocated for rest.`

    if (!isApiKeyPlaceholder && plan && plan.blocks) {
      try {
        const blocksStr = plan.blocks.map((b: any) => `- ${b.activity} (${b.type}, ${b.startTime}-${b.endTime})`).join('\n')
        const aiPrompt = `Based on the following scheduled activities for the user's day:
Activities:
${blocksStr}

And the user profile:
- Stage of Life: ${userStage}
- Available Daily Focused Hours: ${focusedHours}

Write a short, encouraging 2-3 sentence explanation explaining the schedule and priority trade-offs (e.g. why we prioritized core tasks, how wellness and daily commitments are balanced, why we have buffers). Focus on support, productivity, and balance. Keep it warm. Output ONLY the raw text explanation.`

        const aiResponse = await aiClient.gateway(userId, {
          taskType: 'medium',
          prompt: aiPrompt,
          systemPrompt: 'You are a warm, supportive AI Chief of Staff helping a user understand their daily schedule priorities.'
        })
        if (aiResponse) {
          explanation = aiResponse.trim()
        }
      } catch (e) {
        console.warn('AI planning explanation generation failed, using local builder:', e)
      }
    }

    // High fidelity fallback if AI response is missing or failed
    if (explanation.startsWith('I have organized your schedule') && plan && plan.blocks) {
      const hasStudy = plan.blocks.some((b: any) => b.activity.toLowerCase().match(/gate|gre|exam|study|prep|upsc|cat/))
      const hasCode = plan.blocks.some((b: any) => b.activity.toLowerCase().match(/code|software|portfolio|programming|development/))

      if (optimizeType === 'low_energy') {
        explanation = `Active Recovery Mode activated. Since your energy level is low, I have deferred demanding tasks. We locked in only low-energy habits and lightweight routines to protect you from burnout and build consistency.`
      } else if (optimizeType === 'new_urgent_task') {
        explanation = `Adjusted your schedule to accommodate a new urgent task. Lighter tasks have been shifted down to make room.`
      } else if (hasStudy) {
        explanation = `Prioritized your exam preparation today. We scheduled a deep study block during your peak focus hours. A recovery slot is allocated for your routine commitments, and evenings are kept light to protect your work-life balance and spend quality time with family.`
      } else if (hasCode) {
        explanation = `Today's schedule centers around coding and building your project portfolio. We structured 180 minutes of development focus. Routine sports blocks are preserved to refresh your mental clarity, and we added a 15-minute buffer before your next block.`
      } else {
        explanation = `I have balanced your professional tasks with your wellness routines today. Deep focus sessions are locked into your preferred focus windows, with 15-minute buffers in between to avoid decision fatigue and maintain sustainable pacing.`
      }
    }

    return NextResponse.json({
      data: {
        ...plan,
        explanation,
      },
    })
  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate plan' } }, { status: 500 })
  }
}
