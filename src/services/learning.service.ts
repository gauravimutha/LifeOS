import { db } from '@/lib/db'
import { aiClient } from './ai/client'

export const learningEngine = {
  /**
   * Analyzes recent execution history to learn patterns and save AI Memories for better planning.
   */
  async digestDay(userId: string, date: Date): Promise<{ success: boolean; error?: string }> {
    try {
      const dateStr = date.toISOString().split('T')[0]

      // Fetch last 7 days of history to detect patterns
      const history = await db.executionHistory.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 50
      })

      if (history.length === 0) {
        return { success: true }
      }

      // Calculate simple stats
      const total = history.length
      const completed = history.filter((h: any) => h.status === 'completed').length
      const skipped = history.filter((h: any) => h.status === 'skipped').length
      const rate = Math.round((completed / total) * 100)

      // Group skipped by type
      const skippedByType: Record<string, number> = {}
      history.filter((h: any) => h.status === 'skipped').forEach((h: any) => {
        skippedByType[h.type] = (skippedByType[h.type] || 0) + 1
      })

      const prompt = `You are the AI Learning Engine for LifeOS, a premium AI Chief of Staff.
Analyze the user's execution patterns over the last week:
Total Actions Scheduled: ${total}
Completed: ${completed}
Skipped: ${skipped}
Completion Rate: ${rate}%
Skipped by Category: ${JSON.stringify(skippedByType)}

User Notes/Feedback from recent days:
${history.filter((h: any) => h.notes).slice(0, 5).map((h: any) => `- ${h.notes}`).join('\n')}

Identify 1-2 key patterns (e.g. "User consistently skips Gym in the evening", "User is highly productive with DSA in the morning", "User suffers from high scheduling variance").
Return a JSON array of memories to save, matching this schema:
[
  {
    "key": "user.patterns.[unique_pattern_identifier]",
    "value": "Description of learned pattern/recommendation (max 1 sentence)",
    "memoryType": "pattern",
    "confidence": 0.85
  }
]
Return ONLY raw JSON.`

      let response: string | null = null
      const apiKey = process.env.OPENROUTER_API_KEY || ''
      const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

      if (!isApiKeyPlaceholder) {
        try {
          response = await aiClient.gateway(userId, {
            taskType: 'medium',
            prompt,
            systemPrompt: 'You are an execution analysis engine returning strict JSON.'
          })
        } catch (e) {
          console.warn('[LearningEngine] AI call failed, falling back:', e)
        }
      }

      let memories: any[] = []
      if (response) {
        try {
          const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          memories = JSON.parse(cleaned)
        } catch (err) {
          console.warn('[LearningEngine] Failed to parse memories:', err)
        }
      }

      // If AI failed or placeholder, write a default memory based on completion rate
      if (memories.length === 0) {
        memories = [
          {
            key: 'user.patterns.weekly_completion_rate',
            value: `User has a weekly action completion rate of ${rate}%.`,
            memoryType: 'pattern',
            confidence: 1.0
          }
        ]
        if (rate < 50) {
          memories.push({
            key: 'user.patterns.scheduling_density',
            value: 'User shows indicators of high workload fatigue. Recommend reducing focus hours and increasing recovery buffers.',
            memoryType: 'pattern',
            confidence: 0.90
          })
        }
      }

      // Upsert memories in transaction
      await db.$transaction(
        memories.map(mem =>
          db.aIMemory.upsert({
            where: { userId_key: { userId, key: mem.key } },
            update: { value: mem.value, confidence: mem.confidence || 0.8, isActive: true },
            create: { userId, key: mem.key, value: mem.value, memoryType: mem.memoryType, confidence: mem.confidence || 0.8, isActive: true }
          })
        )
      )

      return { success: true }
    } catch (err) {
      console.error('[LearningEngine] Digest failed:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}
