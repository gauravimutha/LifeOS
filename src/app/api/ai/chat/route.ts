import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COACH_PERSONALITIES } from '@/types/checkin'
import { isRateLimited } from '@/lib/rateLimit'
import { verifyUser } from '@/lib/auth'

async function getAIResponse(messages: { role: string; content: string }[]) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://api.openai.com/v1'

  if (apiKey) {
    const isOpenRouter = !!process.env.OPENROUTER_API_KEY
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(isOpenRouter ? { 'HTTP-Referer': 'https://lifeos.app', 'X-Title': 'LifeOS' } : {}),
      },
      body: JSON.stringify({
        model: isOpenRouter ? 'openai/gpt-oss-20b:free' : 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        stream: true,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`AI API error: ${res.status} ${errorText}`)
    }

    return res
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const responseText = `I'm your LifeOS AI assistant. I can help you with goal planning, task management, journal analysis, and productivity insights. How can I help you today?`
      const chunks = responseText.split(' ')
      chunks.forEach((chunk, i) => {
        setTimeout(() => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk + ' ' } }] })}\n\n`))
          if (i === chunks.length - 1) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        }, i * 50)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, messages, sessionId, personalityId } = body

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    if (userId && isRateLimited(userId, 15)) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please try again in a minute.' } },
        { status: 429 }
      )
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'messages array is required' } }, { status: 400 })
    }

    const personality = COACH_PERSONALITIES.find((p) => p.id === personalityId) ?? COACH_PERSONALITIES[0]

    let checkinContext = ''
    if (userId) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayCheckin = await prisma.checkIn.findFirst({
        where: {
          userId,
          date: { gte: today, lt: tomorrow },
        },
      })

      if (todayCheckin) {
        checkinContext = `\nToday's Check-in: Mood ${todayCheckin.mood}/5, Energy ${todayCheckin.energyMorning}/10${todayCheckin.sleepHours ? `, Sleep ${todayCheckin.sleepHours}h` : ''}${todayCheckin.focusToday ? `, Focus: "${todayCheckin.focusToday}"` : ''}${todayCheckin.obstacles ? `, Obstacles: "${todayCheckin.obstacles}"` : ''}`
      }

      const [pendingTasks, goals, memories] = await Promise.all([
        prisma.roadmapStep.count({
          where: { roadmap: { userId }, isCompleted: false },
        }),
        prisma.goal.findMany({
          where: { userId, status: 'active', deletedAt: null },
          select: { title: true, priority: true }
        }),
        prisma.aIMemory.findMany({
          where: { userId, isActive: true, deletedAt: null },
          select: { key: true, value: true }
        })
      ])

      const goalsString = goals.map((g) => `- ${g.title} (Priority: ${g.priority})`).join('\n')
      const memoriesString = memories.map((m) => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n')

      checkinContext += `\nCurrent Status: ${pendingTasks} pending roadmap steps, ${goals.length} active goals.`
      if (goalsString) checkinContext += `\nActive Goals:\n${goalsString}`
      if (memoriesString) checkinContext += `\nAI Memory & Preferences:\n${memoriesString}`
    }

    const socraticInstructions = `
Key Operational Guidelines:
1. Decision Assistant: When the user asks "What should I do?" or "What should I prioritize?", analyze their active goals, pending tasks, and recent check-ins. Suggest trade-offs clearly (e.g. CAT preparation vs Startup launch) and recommend a healthy balance.
2. Positive Accountability: If the user indicates struggles with procrastination or avoided tasks, respond with supportive curiosity ("Why does it feel hard?") rather than guilt. Offer to simplify tasks (like breaking them down into 15m focus chunks).
3. Connect effort to long-term motivation: Reference their 5-year vision memory ("user.preferences.five_year_vision") to motivate them dynamically instead of using generic quotes.
4. Brevity Constraint: Keep responses extremely short, punchy, and highly concise (maximum 150 words or 2 short paragraphs). Avoid long lists, massive markdown tables, or exhaustive summaries. Group items or suggest focusing on the top 2-3 most critical objectives instead of showing all of them.
5. Language Quality: Write strictly in plain, standard English. Do NOT output any foreign words, non-English scripts, or random characters (such as Hindi, Arabic, Hebrew, or Maori words like लिखा, עי, mohio, id, etc.). Keep vocabulary standard and clear.
6. Adopt selected personality style: "${personality.label}".
`

    const systemMessage = {
      role: 'system',
      content: `${personality.systemPrompt}\n\nYou are a LifeOS AI coach helping the user manage their life, goals, tasks, and productivity. Keep responses concise and actionable. Use the user's data to provide personalized guidance.${socraticInstructions}${checkinContext}`,
    }

    const formattedMessages = [
      systemMessage,
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const aiResponse = await getAIResponse(formattedMessages)

    if (sessionId && userId) {
      const lastMessage = messages[messages.length - 1]
      await prisma.aIChatMessage.create({
        data: {
          userId,
          sessionId,
          role: 'user',
          content: lastMessage.content,
        },
      })
    }

    return aiResponse
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to process chat' } }, { status: 500 })
  }
}
