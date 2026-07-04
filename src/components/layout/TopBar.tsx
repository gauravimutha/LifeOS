'use client'

import { Menu, Search, Bell, Bot, User, Sun, Moon, LogOut } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const signOut = useAuthStore((s) => s.signOut)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className={`fixed top-0 right-0 left-0 z-30 h-14 border-b-2 border-border bg-surface transition-all duration-300 ${sidebarOpen ? 'md:left-60' : 'left-0'}`}>
      <div className="flex h-full items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className={`rounded-sm p-1.5 hover:bg-bg-tertiary neo-transition ${sidebarOpen ? 'md:hidden' : ''}`}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="search"
              placeholder="Search..."
              className="neo-input h-9 w-64 !pl-9 text-sm"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button
            className="rounded-sm p-2 hover:bg-bg-tertiary neo-transition"
            aria-label="AI Assistant"
          >
            <Bot className="h-5 w-5 text-text-secondary" />
          </button>

          <button
            className="rounded-sm p-2 hover:bg-bg-tertiary neo-transition relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-sm p-2 hover:bg-bg-tertiary neo-transition animate-fade-in"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5 text-warning" />
              ) : (
                <Moon className="h-5 w-5 text-text-secondary" />
              )}
            </button>
          )}

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="rounded-sm p-1 hover:bg-bg-tertiary neo-transition ml-1"
              aria-label="User menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-accent-light">
                <User className="h-4 w-4 text-accent" />
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 z-50 w-48 rounded-sm border-2 border-border bg-surface p-2 shadow-neo-sm animate-scale-in">
                  <div className="px-2 py-1.5 border-b border-border-light">
                    <p className="text-xs font-bold truncate text-text-primary">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-text-tertiary truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await signOut()
                      router.push('/login')
                    }}
                    className="w-full mt-1.5 flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-bold text-error hover:bg-error-bg/10 neo-transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
