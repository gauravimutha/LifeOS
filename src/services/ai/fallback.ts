export type AIFeatureMode = 'full_ai' | 'intelligent_fallback' | 'safe_default'

export interface AIFallbackResponse<T> {
  mode: AIFeatureMode
  data: T
  explanation?: string
}

export interface AIFeatureDefinition<T, Args extends any[]> {
  name: string
  
  // 1. Full AI execution utilizing OpenRouter free models
  executeAI(...args: Args): Promise<T>
  
  // 2. Local algorithmic fallback using database and user profiles
  executeIntelligentFallback(...args: Args): Promise<T>
  
  // 3. Static safe default fallback ensuring zero friction and zero blocking
  executeSafeDefault(...args: Args): T
}

/**
 * Executive AI Fallback Orchestration Engine.
 * Runs Full AI -> Intelligent Fallback -> Safe Default failover chain.
 */
export async function executeAIFeature<T, Args extends any[]>(
  feature: AIFeatureDefinition<T, Args>,
  ...args: Args
): Promise<AIFallbackResponse<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY || ''
  const isApiKeyPlaceholder = apiKey.includes('your-key-here') || apiKey === ''

  // If API key is missing or is placeholder, immediately fall back to avoid network latency
  if (isApiKeyPlaceholder) {
    try {
      console.log(`[AI Fallback] Key missing/placeholder. Direct failover to Intelligent Fallback for: ${feature.name}`)
      const result = await feature.executeIntelligentFallback(...args)
      return {
        mode: 'intelligent_fallback',
        data: result,
        explanation: 'Local optimization engines are active (AI key offline).'
      }
    } catch (fallbackErr) {
      console.error(`[AI Fallback] Intelligent fallback failed for: ${feature.name}`, fallbackErr)
      const result = feature.executeSafeDefault(...args)
      return {
        mode: 'safe_default',
        data: result,
        explanation: 'Safe default mode active.'
      }
    }
  }

  // 1. Try Full AI Mode
  try {
    const result = await feature.executeAI(...args)
    return {
      mode: 'full_ai',
      data: result
    }
  } catch (aiErr) {
    console.warn(`[AI Fallback] Full AI execution failed for feature "${feature.name}". Initiating failover...`, aiErr)
    
    // 2. Try Intelligent Fallback
    try {
      const result = await feature.executeIntelligentFallback(...args)
      return {
        mode: 'intelligent_fallback',
        data: result,
        explanation: 'AI models temporarily rate-limited. Running local personalization engine.'
      }
    } catch (fallbackErr) {
      console.error(`[AI Fallback] Intelligent fallback failed for feature "${feature.name}":`, fallbackErr)
      
      // 3. Try Safe Default
      const result = feature.executeSafeDefault(...args)
      return {
        mode: 'safe_default',
        data: result,
        explanation: 'Advanced AI features temporarily offline. Loading default configurations.'
      }
    }
  }
}
