import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiClient } from '@/services/ai/client'
import { verifyUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const authResult = await verifyUser(req, userId)
    if (authResult.error) return authResult.error

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Gather history context
    const [reviews, history, goals, memories] = await Promise.all([
      prisma.dailyReview.findMany({
        where: { userId: userId as string, date: { gte: sevenDaysAgo } },
        orderBy: { date: 'asc' }
      }),
      prisma.executionHistory.findMany({
        where: { userId: userId as string, date: { gte: sevenDaysAgo }, status: 'completed' }
      }),
      prisma.goal.findMany({
        where: { userId: userId as string, status: 'active', deletedAt: null }
      }),
      prisma.aIMemory.findMany({
        where: { userId: userId as string, isActive: true, deletedAt: null }
      })
    ])

    const completedCount = history.length
    const avgProductivity = reviews.length > 0
      ? Math.round(reviews.reduce((sum, r) => sum + (r.productivity || 5), 0) / reviews.length)
      : 7

    const winsList = reviews.map(r => r.completed).filter(Boolean).join('; ')
    const challengesList = reviews.map(r => r.blocked).filter(Boolean).join('; ')
    const visionMemory = memories.find(m => m.key === 'user.preferences.five_year_vision')
    const vision = (visionMemory?.value as any)?.text || 'financial independence and a balanced life'

    let letterText = `Dear User,\n\nHere is your AI Chief of Staff Weekly Letter. This week, you completed ${completedCount} focus tasks and maintained a solid productivity score of ${avgProductivity}/10. I noticed major progress in your goals: ${goals.map(g => g.title).slice(0, 3).join(', ')}. Keep pushing towards your 5-year vision: "${vision}". Let's target consistency next week!\n\nWarmly,\nYour AI Chief of Staff`

    const apiKey = process.env.OPENROUTER_API_KEY || ''
    const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

    if (!isApiKeyPlaceholder) {
      try {
        const prompt = `Write a premium, encouraging, and deeply personalized Weekly Letter from an AI Chief of Staff.
User context:
- Completed tasks: ${completedCount}
- Average productivity score: ${avgProductivity}/10
- Wins logged: ${winsList || 'Completed scheduled routines'}
- Challenges logged: ${challengesList || 'None'}
- Active Goals: ${goals.map(g => g.title).join(', ')}
- 5-Year Vision: "${vision}"

The letter should:
1. Warmly celebrate wins and consistency.
2. Address challenges and setbacks constructively without guilt.
3. Connect effort back to their 5-year vision.
4. Give 2 concrete pacing suggestions for next week.
5. Keep the tone premium, intelligent, supportive, and write in 3 paragraphs. Sign off as 'Your AI Chief of Staff'.`

        const response = await aiClient.gateway(userId || undefined, {
          taskType: 'large',
          prompt,
          systemPrompt: 'You are an executive AI Chief of Staff writing a weekly performance briefing letter.'
        })
        if (response) {
          letterText = response.trim()
        }
      } catch (err) {
        console.warn('AI Weekly Letter generation failed:', err)
      }
    }

    // High fidelity template fallback
    if (letterText.startsWith('Dear User')) {
      const hasStudy = goals.some(g => g.title.toLowerCase().match(/gate|gre|exam|study|prep|upsc|cat/))
      const hasStartup = goals.some(g => g.title.toLowerCase().match(/startup|business|launch/))

      letterText = `Hello,\n\nReflecting on the past 7 days, your consistency has been remarkable. You successfully locked in ${completedCount} focus tasks, maintaining an average productivity and mood level of ${avgProductivity}/10. \n\n${
        hasStudy 
          ? "Your focus on competitive exam preparation remains your core leverage point. Even with competing daily distractions, protecting your deep work windows has paid off."
          : hasStartup
          ? "Building a startup requires relentless momentum. The small, bite-sized tasks you checked off this week are compounding, moving you step-by-step closer to launch readiness."
          : "By successfully balancing your wellness routines with active project execution, you are proving that consistency matters far more than single-day perfection."
      } We remain aligned to your five-year vision of "${vision}".\n\nFor the upcoming week, I suggest two specific adjustments: first, lock in your primary study/focus block before 11 AM when cognitive energy peaks, and second, allocate at least one 15-minute daily rest buffer to protect against cumulative fatigue.\n\nWarmly,\nYour AI Chief of Staff`
    }

    return NextResponse.json({
      data: {
        letterText,
        stats: {
          completedCount,
          avgProductivity,
          activeGoalsCount: goals.length
        }
      }
    })
  } catch (error) {
    console.error('Failed to generate weekly review letter:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate weekly letter' } }, { status: 500 })
  }
}
