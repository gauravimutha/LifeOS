'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Card, Button } from '@/components/ui'
import {
  Sun, Moon, Monitor, User, Shield,
  Database, Trash2, Download, ChevronRight, Palette,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-text-secondary">
          Manage your preferences
        </p>
      </div>

      {/* Profile */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-text-secondary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Profile</h2>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="neo-label">Full Name</label>
            <input type="text" key={user?.user_metadata?.full_name} defaultValue={user?.user_metadata?.full_name ?? ''} className="neo-input w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="neo-label">Email</label>
            <input type="email" key={user?.email} defaultValue={user?.email ?? ''} className="neo-input w-full" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="neo-label">Timezone</label>
            <select className="neo-input w-full">
              <option>America/New_York (UTC-5)</option>
              <option>America/Chicago (UTC-6)</option>
              <option>America/Denver (UTC-7)</option>
              <option>America/Los_Angeles (UTC-8)</option>
              <option>Europe/London (UTC+0)</option>
            </select>
          </div>
          <Button size="sm">Save Changes</Button>
        </div>
      </Card>

      {/* Preferences */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-text-secondary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Preferences</h2>
        </div>
        <div className="space-y-4">
          {/* Theme */}
          <div>
            <p className="neo-label mb-2">Theme</p>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          {/* Locale */}
          <div>
            <p className="neo-label mb-2">Locale</p>
            <select className="neo-input w-full max-w-xs">
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>

          {/* Notifications */}
          <div>
            <p className="neo-label mb-2">Notifications</p>
            <div className="space-y-2">
              {[
                { label: 'Daily briefing', desc: 'Morning AI summary of your day' },
                { label: 'Task reminders', desc: 'When tasks are due or overdue' },
                { label: 'Habit nudges', desc: 'Gentle reminders for your habits' },
                { label: 'Weekly report', desc: 'Weekly analytics summary' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-sm border-2 border-border bg-bg p-3">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.desc}</p>
                  </div>
                  <div className={cn(
                    'h-5 w-9 rounded-sm border-2 cursor-pointer neo-transition',
                    true ? 'bg-accent border-accent' : 'bg-bg-tertiary border-border',
                  )}>
                    <div className={cn(
                      'h-full w-4 rounded-sm bg-white neo-transition',
                      true && 'ml-auto',
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Settings */}
      <Link href="/settings/ai">
        <Card padding="md" className="flex items-center justify-between hover:bg-bg-secondary neo-transition">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold">AI Settings</h2>
              <p className="text-xs text-text-tertiary">Personality, memory, and data preferences</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-text-tertiary" />
        </Card>
      </Link>

      {/* Data Management */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-text-secondary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Data Management</h2>
        </div>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Download className="h-4 w-4" />
            Export All Data
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <Trash2 className="h-4 w-4 text-error" />
            Clear AI Memory
          </Button>
          <Button variant="danger" className="w-full justify-start">
            <Shield className="h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  )
}
