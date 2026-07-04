'use client'

import { cn } from '@/lib/utils'

interface GoalProgressProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const sizeConfig = {
  sm: { bar: 'h-1.5', text: 'text-[10px]' },
  md: { bar: 'h-2', text: 'text-xs' },
  lg: { bar: 'h-3', text: 'text-sm' },
}

const variantColors = {
  default: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

export function GoalProgress({ progress, size = 'md', showLabel = true, variant }: GoalProgressProps) {
  const safeProgress = Math.max(0, Math.min(100, progress))
  const config = sizeConfig[size]

  const colorVariant = variant ?? (
    safeProgress >= 100 ? 'success' :
    safeProgress >= 50 ? 'warning' :
    'default'
  )

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className={cn('flex-1 rounded-full bg-bg-tertiary overflow-hidden', config.bar)}>
        <div
          className={cn('h-full rounded-full neo-transition', variantColors[colorVariant])}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-semibold text-text-secondary shrink-0', config.text)}>
          {safeProgress}%
        </span>
      )}
    </div>
  )
}
