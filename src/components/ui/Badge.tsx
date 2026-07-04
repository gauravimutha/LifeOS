import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold uppercase tracking-wider border-2',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface text-text-primary',
        primary: 'border-accent bg-accent-light text-accent',
        success: 'border-success bg-success-bg text-success',
        warning: 'border-warning bg-warning-bg text-warning',
        error: 'border-error bg-error-bg text-error',
        accent: 'border-accent bg-accent text-accent-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}
