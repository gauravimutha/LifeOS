import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/rateLimit'

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''

// High efficiency in-memory cache to prevent duplicate expensive LLM calls
const gatewayCache = new Map<string, { response: string; expiresAt: number }>()

interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AICompletionResponse {
  choices: {
    message: {
      role: string
      content: string
    }
  }[]
}

// Router configuration matching user specification
const MODEL_MAPPING = {
  tiny: 'qwen/qwen3-32b:free',           // Fast
  medium: 'google/gemma-3-27b-it:free',  // Planning
  large: 'deepseek/deepseek-r1-0528:free' // Reasoning
}

export const aiClient = {
  /**
   * AI Gateway - Single source of truth for all AI traffic in LifeOS
   */
  async gateway(
    userId: string | undefined,
    options: {
      taskType: 'tiny' | 'medium' | 'large'
      prompt: string
      systemPrompt?: string
      useCache?: boolean
      bypassContext?: boolean
    }
  ): Promise<string> {
    const startTime = Date.now()
    const useCache = options.useCache !== false

    // 1. Rate Limiting Check
    if (userId) {
      const rateLimitKey = `ai_gate:${userId}`
      if (isRateLimited(rateLimitKey, 20)) {
        throw new Error('AI Rate limit exceeded. Please wait a minute before making another request.')
      }
    }

    // 2. Response Cache Check
    const cacheKey = `${userId || 'anon'}:${options.taskType}:${options.prompt}:${options.systemPrompt || ''}`
    if (useCache && gatewayCache.has(cacheKey)) {
      const cached = gatewayCache.get(cacheKey)!
      if (cached.expiresAt > Date.now()) {
        console.log('[AI Gateway] Cache HIT - Saved cost and latency.')
        return cached.response
      }
      gatewayCache.delete(cacheKey)
    }

    // 3. Dynamic Context Retriever
    let goalsContext = ''
    let memoriesContext = ''

    if (userId && !options.bypassContext) {
      try {
        const [activeGoals, memories] = await Promise.all([
          prisma.goal.findMany({
            where: { userId, status: 'active', deletedAt: null },
            select: { title: true, level: true, progress: true },
            take: 5
          }),
          prisma.aIMemory.findMany({
            where: { userId, isActive: true, deletedAt: null },
            select: { key: true, value: true },
            take: 8
          })
        ])

        if (activeGoals.length > 0) {
          goalsContext = `\nActive Goals:\n${activeGoals.map(g => `- ${g.title} (${g.level}, ${g.progress}% progress)`).join('\n')}`
        }
        if (memories.length > 0) {
          memoriesContext = `\nAI Memories & Preferences:\n${memories.map(m => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n')}`
        }
      } catch (err) {
        console.warn('[AI Gateway] Context retrieval failed, proceeding with fallback:', err)
      }
    }

    // 4. Model Router Selection
    const primaryModel = MODEL_MAPPING[options.taskType] || MODEL_MAPPING.medium
    const isApiKeyPlaceholder = !OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('your-key-here') || OPENROUTER_API_KEY === ''

    // Construct Messages
    const systemPromptBase = options.systemPrompt ?? 'You are LifeOS, a premium AI Chief of Staff helping a user personalizing their day.'
    const fullSystemPrompt = `${systemPromptBase}${goalsContext}${memoriesContext}`

    const messages: AIChatMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      { role: 'user', content: options.prompt }
    ]

    let responseContent = ''
    let activeModelUsed = primaryModel

    if (isApiKeyPlaceholder) {
      // 5. Fallback Mock response builder if no API key is present
      responseContent = this.generateLocalFallback(options.prompt, systemPromptBase)
    } else {
      // 6. Execute External LLM call sequentially with multiple fallbacks
      try {
        let res = null
        let success = false
        
        // Retrieve a unique list of model candidates to try in order based on user specification
        const uniqueModels = Array.from(new Set([
          primaryModel,
          'google/gemma-3-27b-it:free',      // Planning
          'deepseek/deepseek-r1-0528:free',  // Reasoning
          'moonshotai/kimi-k2:free',         // General
          'qwen/qwen3-32b:free',             // Fast
          'openai/gpt-oss-20b:free'          // Backup
        ]))

        for (const currentModel of uniqueModels) {
          try {
            console.log(`[AI Gateway] Attempting call using model: ${currentModel}`)
            res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://lifeos.app',
                'X-Title': 'LifeOS AI Gateway'
              },
              body: JSON.stringify({
                model: currentModel,
                messages,
                temperature: 0.7,
                max_tokens: options.taskType === 'tiny' ? 512 : options.taskType === 'medium' ? 2048 : 4096,
                stream: false
              })
            })

            if (res.ok) {
              activeModelUsed = currentModel
              success = true
              console.log(`[AI Gateway] Model call succeeded with model: ${currentModel}`)
              break
            } else {
              const errBody = await res.clone().text()
              console.warn(`[AI Gateway] Model ${currentModel} failed with status ${res.status}: ${errBody}`)
            }
          } catch (fetchErr) {
            console.warn(`[AI Gateway] Model ${currentModel} request network failure:`, fetchErr)
          }
        }

        if (!success || !res) {
          throw new Error('All candidate LLM models failed or returned rate limits/errors.')
        }

        const data: AICompletionResponse = await res.json()
        responseContent = data.choices[0]?.message?.content ?? ''
      } catch (err) {
        console.error('[AI Gateway] Error calling LLM, running local mock fallback:', err)
        responseContent = this.generateLocalFallback(options.prompt, systemPromptBase)
      }
    }

    responseContent = responseContent.trim()

    // 7. Save Response Cache (5 minute lifetime)
    if (useCache && responseContent) {
      gatewayCache.set(cacheKey, {
        response: responseContent,
        expiresAt: Date.now() + 5 * 60000
      })
    }

    // 8. Auditing & Cost Metrics Logging (Non-blocking)
    if (userId) {
      const latencyMs = Date.now() - startTime
      prisma.analyticsEvent.create({
        data: {
          userId,
          eventType: 'ai_gateway_call',
          eventData: {
            model: activeModelUsed,
            taskType: options.taskType,
            promptLength: options.prompt.length,
            responseLength: responseContent.length,
            latencyMs,
            cached: false,
            estimatedCost: options.taskType === 'tiny' ? 0.0001 : options.taskType === 'medium' ? 0.0005 : 0.002
          } as any
        }
      }).catch(err => console.error('[AI Gateway] Audit log failed:', err))
    }

    return responseContent
  },



  /**
   * Local Mock Fallback for cost-control and offline development stability
   */
  generateLocalFallback(prompt: string, systemPrompt: string): string {
    const lower = prompt.toLowerCase()

    if (lower.includes('milestone') || lower.includes('successmetrics') || lower.includes('goal')) {
      return JSON.stringify({
        category: 'personal-growth',
        priority: 'medium',
        difficulty: 'medium',
        estimatedDuration: '3 months',
        weeklyCommitment: 5,
        successMetrics: ['Maintain daily habit routines', 'Deliver key project milestones'],
        milestones: [
          { title: 'Foundational outlines', description: 'Setup objectives.', targetDate: 'Week 2', completed: false }
        ],
        realityCheck: 'Achievable and well balanced.',
        conflicts: [],
        reasoning: { category: 'Personal growth.', priority: 'Standard.', difficulty: 'Accessible.', timeline: '3 months.' }
      })
    }

    if (lower.includes('reflection') || lower.includes('how did today go')) {
      return JSON.stringify({
        wins: ['Completed focus task'],
        problems: [],
        lesson: 'Protected schedule buffers.',
        mood: 'good'
      })
    }

    if (lower.includes('recommendation') || lower.includes('conflict')) {
      return `Based on your active goals, your schedule is balanced. We recommend blocking 90 minutes of dedicated study tomorrow morning.`
    }

    return `I am your AI Chief of Staff. I checked your configuration and locked in your optimal plan with healthy buffers. Let's make progress today!`
  }
}
