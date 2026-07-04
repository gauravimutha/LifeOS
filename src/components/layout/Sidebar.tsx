'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Target,
  ListTodo,
  Repeat,
  Clock,
  BookOpen,
  Heart,
  Users,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const primaryNav: NavItem[] = [
  { label: 'Home', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Plan', href: '/plan', icon: Calendar },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Routines', href: '/routines', icon: Clock },
]

const secondaryNav: NavItem[] = [
  { label: 'Journal', href: '/journal', icon: BookOpen },
  { label: 'Health', href: '/health', icon: Heart },
  { label: 'Check-in', href: '/check-in', icon: ClipboardCheck },
  { label: 'Reviews', href: '/reviews', icon: FileText },
  { label: 'Relationships', href: '/relationships', icon: Users },
  { label: 'AI Chat', href: '/ai', icon: Bot },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const signOut = useAuthStore((s) => s.signOut)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.email === 'admin@lifeos.com'

  if (!sidebarOpen) return null

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r-2 border-border bg-surface">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b-2 border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-sm font-bold text-accent-text">
            L
          </div>
          <span className="text-lg font-bold tracking-tight">LifeOS {isAdmin && <span className="text-xs text-accent font-mono uppercase font-bold">(Admin)</span>}</span>
        </Link>
        <button
          onClick={toggleSidebar}
          className="rounded-sm p-1 hover:bg-bg-tertiary neo-transition hidden md:block"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        {isAdmin ? (
          <div className="space-y-0.5">
            <p className="neo-label px-3 pb-1">Administration</p>
            <Link
              href="/"
              className={cn(
                'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-semibold neo-transition',
                pathname === '/'
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Manage Users</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 space-y-0.5">
              <p className="neo-label px-3 pb-1">Main</p>
              {primaryNav.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-semibold neo-transition',
                      isActive
                        ? 'bg-accent-light text-accent'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="space-y-0.5">
              <p className="neo-label px-3 pb-1">Life Areas</p>
              {secondaryNav.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-semibold neo-transition',
                      isActive
                        ? 'bg-accent-light text-accent'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t-2 border-border p-3 space-y-1">
        {!isAdmin && (
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-semibold neo-transition',
              pathname.startsWith('/settings')
                ? 'bg-accent-light text-accent'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
        )}
        <button
          onClick={async () => {
            await signOut()
            router.push('/login')
          }}
          className="w-full flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-semibold text-error hover:bg-error-bg/10 neo-transition cursor-pointer text-left"
        >
          <LogOut className="h-4 w-4 shrink-0 text-error" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
