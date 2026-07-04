'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type HTMLAttributes } from 'react'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-sm border-2 border-border bg-surface font-bold text-text-secondary overflow-hidden shrink-0',
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
        ) : (
          <span>{fallback ?? '?'}</span>
        )}
      </div>
    )
  },
)
Avatar.displayName = 'Avatar'
