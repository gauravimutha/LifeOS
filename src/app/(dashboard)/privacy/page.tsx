'use client'

import { Card } from '@/components/ui'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          Privacy Policy
        </h1>
        <p className="text-sm text-text-secondary">Last updated: July 2026</p>
      </div>

      <Card padding="lg" className="space-y-6 text-sm leading-relaxed text-text-secondary">
        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">1. Information We Collect</h2>
          <p>
            LifeOS is an AI Personal Life Operating System. To provide personalized suggestions, we collect information you explicitly provide, including goals, tasks, routines, journal entries, sleep logs, and responses in the AI onboarding conversation.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">2. How We Use Information</h2>
          <p>
            Your information is used solely to construct your personalized dashboard, perform AI goal decomposition, adapt your daily calendar schedules, and maintain persistent memory for your AI Chief of Staff.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">3. Zero-Knowledge & Data Isolation</h2>
          <p>
            Every user record is isolated strictly by your authenticated user ID. We enforce database-level access control lists and do not sell, rent, or leak your personal data or AI conversation transcripts to third parties.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary mb-2">4. Your Controls</h2>
          <p>
            You have the right to view, download, or permanently delete all your stored AI memories and data via the Account Settings page at any time.
          </p>
        </div>
      </Card>
    </div>
  )
}
