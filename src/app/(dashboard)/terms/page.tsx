'use client'

import { Card } from '@/components/ui'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-accent" />
          Terms of Service
        </h1>
        <p className="text-sm text-text-secondary">Last updated: July 2026</p>
      </div>

      <Card padding="lg" className="space-y-6 text-sm leading-relaxed text-text-secondary">
        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">1. Agreement to Terms</h2>
          <p>
            By creating an account on LifeOS, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not access or use the platform.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">2. Description of Service</h2>
          <p>
            LifeOS provides AI-driven productivity planning, memory tracking, and daily schedule optimization. Services are provided "as is" and "as available". We make no warranties regarding timeline accuracy or AI accuracy.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">3. User Responsibility</h2>
          <p>
            You are responsible for securing your login credentials and session keys. You agree not to abuse or script the platform's API endpoints or AI generation channels.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">4. Disclaimers</h2>
          <p>
            The AI Chief of Staff acts as an advisor for goal setting. It is not a professional counsellor, medical advisor, or financial consultant. Any actionable choices are made at your own discretion.
          </p>
        </div>
      </Card>
    </div>
  )
}
