'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, ListTodo, Bot, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'

const mobileNavItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/plan', label: 'Plan', icon: Calendar },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/ai', label: 'AI', icon: Bot },
]

export function BottomBar() {
  const pathname = usePathname()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-border bg-surface md:hidden">
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 neo-transition',
                isActive
                  ? 'text-accent'
                  : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-text-tertiary"
          aria-label="More options"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            More
          </span>
        </button>
      </div>
    </nav>
  )
}
