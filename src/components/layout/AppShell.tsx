'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomBar } from './BottomBar'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { usePathname, useRouter } from 'next/navigation'

export function AppShell({ children }: { children: ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    // Skip checks during initial auth load
    if (isLoading) return

    // If not authenticated, redirect to login (except root page, onboarding, login, signup, register)
    if (!isAuthenticated) {
      if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup' && pathname !== '/register' && pathname !== '/onboarding') {
        router.push('/login')
      }
      setCheckingOnboarding(false)
      return
    }

    // Check onboarding Completed
    async function checkOnboarding() {
      try {
        const res = await fetch(`/api/onboarding?userId=${user?.id}`)
        const json = await res.json()
        if (json.data && json.data.onboardingCompleted === false) {
          if (pathname !== '/onboarding') {
            router.push('/onboarding')
          }
        }
      } catch (err) {
        console.error('Failed to verify onboarding status:', err)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [user, isAuthenticated, isLoading, pathname, router])

  if (isLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-sm font-semibold animate-pulse">Initializing LifeOS...</span>
      </div>
    )
  }

  // Render onboarding/auth/landing views directly without app bars for unauthenticated users
  if ((pathname === '/' && !isAuthenticated) || pathname === '/onboarding' || pathname === '/login' || pathname === '/signup' || pathname === '/register') {
    return <div className="min-h-screen bg-bg">{children}</div>
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopBar />
      <Sidebar />
      <BottomBar />

      <main
        className={`
          pt-14 pb-16 md:pb-0
          transition-all duration-normal
          ${sidebarOpen ? 'md:ml-60' : ''}
        `}
      >
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
