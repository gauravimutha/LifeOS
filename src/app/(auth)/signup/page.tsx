'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card } from '@/components/ui'

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupForm) {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error?.message || 'Signup failed')
      }

      router.push(`/login?registered=true&email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}`)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-accent text-xl font-bold text-accent-text">
          L
        </div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Get started with your private AI Life OS
        </p>
      </div>

      <Card variant="raised" padding="lg" className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="neo-label">Full Name</label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="neo-input"
              placeholder="Alex Johnson"
            />
            {errors.name && (
              <p className="text-xs font-medium text-error">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="neo-label">Email</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="neo-input"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-xs font-medium text-error">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="neo-label">Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="neo-input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-xs font-medium text-error">{errors.password.message}</p>
            )}
          </div>

          {error && <p className="text-xs font-medium text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
