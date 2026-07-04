'use client'

import { useAuthStore } from '@/stores/authStore'
import { LandingPage } from '@/components/domain/landing/LandingPage'
import { DashboardContent } from '@/components/domain/dashboard/DashboardContent'
import AdminPage from './admin/page'

export default function RootPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-sm font-semibold animate-pulse text-text-primary">Initializing LifeOS...</span>
      </div>
    )
  }

  if (isAuthenticated) {
    if (user?.email === 'admin@lifeos.com') {
      return <AdminPage />
    }
    return <DashboardContent />
  }

  return <LandingPage />
}
