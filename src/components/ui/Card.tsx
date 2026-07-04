import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('neo-border rounded-sm bg-surface', {
  variants: {
    variant: {
      default: 'neo-shadow-sm',
      raised: 'neo-shadow',
      ai: 'border-dashed border-accent',
      highlighted: 'border-l-4 border-l-accent neo-shadow-sm',
      ghost: 'border-transparent shadow-none',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'
