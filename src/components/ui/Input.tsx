import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="neo-label">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'neo-input',
            error && 'border-error focus:border-error focus:shadow-error',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-error">{error}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="neo-label">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            'neo-input min-h-[80px] resize-y',
            error && 'border-error focus:border-error',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-error">{error}</p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
