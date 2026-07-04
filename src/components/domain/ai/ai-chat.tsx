'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIChat } from '@/hooks/use-ai'
import { cn } from '@/lib/utils'
import { Button, Avatar } from '@/components/ui'
import {
  Send,
  Bot,
  ThumbsUp,
  ThumbsDown,
  StopCircle,
} from 'lucide-react'

const suggestedPrompts = [
  'Plan my day',
  'What should I focus on?',
  'Review my goals',
  'Help me prioritize',
]

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Split by ** to extract bold blocks
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, partIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const clean = part.slice(2, -2)
      return <strong key={partIdx} className="font-extrabold text-text-primary">{clean}</strong>
    }
    
    // Split by * to extract italic blocks within non-bold parts
    const subparts = part.split(/(\*.*?\*)/g)
    return subparts.map((sub, subIdx) => {
      if (sub.startsWith('*') && sub.endsWith('*')) {
        const clean = sub.slice(1, -1)
        return <em key={subIdx} className="italic">{clean}</em>
      }
      return sub
    })
  })
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, lineIdx) => {
    // Heading match
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = parseInlineMarkdown(headingMatch[2])
      const className = cn(
        'font-bold my-1.5 block text-text-primary',
        level === 1 && 'text-lg',
        level === 2 && 'text-base',
        level >= 3 && 'text-sm'
      )
      return <span key={lineIdx} className={className}>{content}</span>
    }

    // List item match
    const listMatch = line.match(/^[-*]\s+(.*)$/)
    if (listMatch) {
      return (
        <span key={lineIdx} className="pl-4 py-0.5 flex items-start gap-2 text-sm leading-relaxed">
          <span className="text-accent mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
          <span>{parseInlineMarkdown(listMatch[1])}</span>
        </span>
      )
    }

    // Empty paragraph spacer
    if (!line.trim()) {
      return <span key={lineIdx} className="h-2 block" />
    }

    // Regular line paragraph
    return (
      <span key={lineIdx} className="block text-sm py-0.5 leading-relaxed">
        {parseInlineMarkdown(line)}
      </span>
    )
  })
}

interface AIChatProps {
  context?: string[]
}

export function AIChat({   context = [] }: AIChatProps) {
  const { messages, isStreaming, sendMessage, stopStreaming, sendFeedback } = useAIChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isStreaming) return
    const msg = input.trim()
    setInput('')
    await sendMessage(msg)
  }

  return (
    <div className="flex h-full flex-col rounded-sm border-2 border-border bg-surface neo-shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b-2 border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent">
          <Bot className="h-4 w-4 text-accent-text" />
        </div>
        <div>
          <p className="text-sm font-bold">AI Assistant</p>
          <p className="text-[10px] text-text-tertiary font-medium">LifeOS Coach</p>
        </div>
        {context.length > 0 && (
          <div className="ml-auto flex gap-1">
            {context.map((c, i) => (
              <span key={i} className="rounded-sm border border-accent bg-accent-light px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-10 w-10 text-text-tertiary mb-3" />
            <p className="text-sm font-semibold text-text-secondary mb-2">How can I help you today?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-sm border-2 border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent-light hover:border-accent neo-transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {msg.role === 'assistant' && (
              <Avatar size="sm" fallback="AI" className="mt-0.5" />
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-sm border-2 px-3 py-2',
                msg.role === 'user'
                  ? 'border-accent bg-accent text-accent-text'
                  : 'border-border bg-bg-secondary',
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="space-y-1">{renderMarkdown(msg.content)}</div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mt-2 pt-1 border-t border-border-light">
                  <button
                    onClick={() => sendFeedback(msg.id, 'up')}
                    className={cn(
                      'rounded-sm p-0.5 neo-transition',
                      msg.feedback === 'up' ? 'text-success' : 'text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => sendFeedback(msg.id, 'down')}
                    className={cn(
                      'rounded-sm p-0.5 neo-transition',
                      msg.feedback === 'down' ? 'text-error' : 'text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <Avatar size="sm" fallback="U" className="mt-0.5" />
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="flex gap-3 justify-start">
            <Avatar size="sm" fallback="AI" className="mt-0.5" />
            <div className="max-w-[75%] rounded-sm border-2 border-border bg-bg-secondary px-3 py-2">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t-2 border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            className="neo-input flex-1 h-10"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button variant="ghost" size="icon" onClick={stopStreaming}>
              <StopCircle className="h-5 w-5 text-error" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
