'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  feedback?: 'up' | 'down'
  actions?: Array<{ label: string; action: string }>
}

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  context: string[]
}

export function useAIChat() {
  const user = useAuthStore((s) => s.user)
  const [state, setState] = useState<ChatState>({
    messages: [],
    isStreaming: false,
    context: [],
  })
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string, personalityId?: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isStreaming: true,
    }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          messages: [
            ...state.messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content }
          ],
          personalityId: personalityId ?? state.context.find((c) => c.startsWith('personality:'))?.replace('personality:', ''),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const assistantId = crypto.randomUUID()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let deltaText = ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.slice(6)
              const parsed = JSON.parse(jsonStr)
              const contentToken = parsed.choices?.[0]?.delta?.content || ''
              deltaText += contentToken
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }

        if (deltaText) {
          accumulated += deltaText
          setState((prev) => {
            const existing = prev.messages.find((m) => m.id === assistantId)
            if (existing) {
              return {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m,
                ),
              }
            }
            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: assistantId,
                  role: 'assistant',
                  content: accumulated,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          })
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const jsonStr = trimmed.slice(6)
            const parsed = JSON.parse(jsonStr)
            const contentToken = parsed.choices?.[0]?.delta?.content || ''
            const lastToken = contentToken
            if (lastToken) {
              accumulated += lastToken
              setState((prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m,
                ),
              }))
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            timestamp: new Date().toISOString(),
          },
        ],
      }))
    } finally {
      setState((prev) => ({ ...prev, isStreaming: false }))
    }
  }, [state.context, state.messages, user])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const sendFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === messageId ? { ...m, feedback } : m,
      ),
    }))
  }, [])

  const clearChat = useCallback(() => {
    setState({ messages: [], isStreaming: false, context: [] })
  }, [])

  const setContext = useCallback((context: string[]) => {
    setState((prev) => ({ ...prev, context }))
  }, [])

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    context: state.context,
    sendMessage,
    stopStreaming,
    sendFeedback,
    clearChat,
    setContext,
  }
}
