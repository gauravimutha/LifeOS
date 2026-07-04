import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold neo-border neo-transition active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-text neo-shadow-sm hover:neo-shadow',
        secondary: 'bg-surface text-text-primary hover:bg-bg-tertiary neo-shadow-sm',
        ghost: 'border-transparent bg-transparent hover:bg-bg-tertiary shadow-none active:shadow-none',
        danger: 'bg-error text-white neo-shadow-sm hover:neo-shadow',
        outline: 'bg-transparent text-text-primary hover:bg-bg-tertiary',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
