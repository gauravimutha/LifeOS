'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Modal, toast } from '@/components/ui'
import {
  Users,
  Target,
  CheckCircle2,
  UserCheck,
  Loader2,
  Search,
  Plus,
  Edit2,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  onboardedUsers: number
  totalGoals: number
  completedTasks: number
  recentUsers: Array<{
    id: string
    name: string
    email: string
    onboardingCompleted: boolean
    timezone: string
    isApproved: boolean
    createdAt: string
    deletedAt: string | null
  }>
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'pending' | 'deactivated'>('all')

  // Modal states
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Create form states
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newOnboarded, setNewOnboarded] = useState(false)

  // Edit form states
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editOnboarded, setEditOnboarded] = useState(false)
  const [editTimezone, setEditTimezone] = useState('UTC')
  const [editApproved, setEditApproved] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      const json = await res.json()
      if (json.data) {
        setStats(json.data)
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err)
      toast('Failed to load admin telemetry stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Create user handler
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      toast('Name and email are required', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          onboardingCompleted: newOnboarded
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create user')
      }

      toast('User created successfully', 'success')
      setCreateOpen(false)
      setNewName('')
      setNewEmail('')
      setNewOnboarded(false)
      fetchStats()
    } catch (err: any) {
      toast(err.message || 'Failed to create user', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Edit user handler
  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    if (!editName.trim() || !editEmail.trim()) {
      toast('Name and email are required', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          onboardingCompleted: editOnboarded,
          timezone: editTimezone,
          isApproved: editApproved
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update user')
      }

      toast('User details updated', 'success')
      setEditOpen(false)
      setEditingUser(null)
      fetchStats()
    } catch (err: any) {
      toast(err.message || 'Failed to update user', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Quick toggle onboarding Completed status
  async function handleToggleOnboarding(userId: string, currentVal: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingCompleted: !currentVal
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to toggle onboarding')
      }

      toast('Onboarding status updated', 'success')
      fetchStats()
    } catch (err: any) {
      toast(err.message || 'Failed to update onboarding', 'error')
    }
  }

  // Toggle soft delete/deactivation status
  async function handleToggleDelete(userId: string, isDeleted: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update status')
      }

      toast(isDeleted ? 'User account restored' : 'User account deactivated', 'success')
      fetchStats()
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error')
    }
  }

  // Hard delete/remove user permanently
  async function handleHardDelete(userId: string, name: string) {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user "${name}"? This will delete all of their roadmaps, goals, reviews, and logs. This action CANNOT be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}?hard=true`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to permanently delete user')
      }

      toast('User deleted permanently', 'success')
      fetchStats()
    } catch (err: any) {
      toast(err.message || 'Failed to delete user', 'error')
    }
  }

  // Filter and search user records client side
  const getFilteredUsers = () => {
    if (!stats) return []
    return stats.recentUsers.filter((u) => {
      // Search matches
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (!matchesSearch) return false

      // Filter matches
      const isDeleted = u.deletedAt !== null
      switch (activeFilter) {
        case 'active':
          return !isDeleted
        case 'pending':
          return !isDeleted && !u.isApproved
        case 'deactivated':
          return isDeleted
        default:
          return true
      }
    })
  }

  const filteredUsers = getFilteredUsers()

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Global SaaS user count tracking and system analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchStats} className="flex items-center gap-1.5 bg-surface text-text-primary">
            <RefreshCw className="h-4 w-4" /> Refresh Stats
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 bg-accent text-accent-text">
            <Plus className="h-4 w-4" /> Create User
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <span className="text-sm text-text-tertiary">Loading metrics...</span>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md" className="space-y-2 border-l-4 border-l-accent">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Total Users</span>
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-extrabold">{stats.totalUsers}</p>
            </Card>

            <Card padding="md" className="space-y-2 border-l-4 border-l-info">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Onboarded Users</span>
                <UserCheck className="h-5 w-5 text-info" />
              </div>
              <p className="text-3xl font-extrabold">{stats.onboardedUsers}</p>
            </Card>

            <Card padding="md" className="space-y-2 border-l-4 border-l-warning">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Active Goals</span>
                <Target className="h-5 w-5 text-warning" />
              </div>
              <p className="text-3xl font-extrabold">{stats.totalGoals}</p>
            </Card>

            <Card padding="md" className="space-y-2 border-l-4 border-l-success">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Completed Tasks</span>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-3xl font-extrabold">{stats.completedTasks}</p>
            </Card>
          </div>

          {/* User Directory Control Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-bg-secondary rounded-sm border-2 border-border max-w-max">
              {(['all', 'active', 'pending', 'deactivated'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'px-3 py-1 rounded-sm text-xs font-bold uppercase font-mono transition-all cursor-pointer',
                    activeFilter === filter
                      ? 'bg-accent text-accent-text border border-border shadow-[1px_1px_0px_0px_var(--color-border)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 text-sm neo-input"
              />
            </div>
          </div>

          {/* Users Directory Table */}
          <Card padding="md" className="space-y-3">
            <h2 className="neo-label text-base font-bold text-text-primary">User Directory ({filteredUsers.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-border text-xs uppercase font-bold text-text-tertiary">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Timezone</th>
                    <th className="py-2.5">Onboarded</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5">Joined</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm font-semibold">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-tertiary">
                        No users match the search queries and filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isDeleted = u.deletedAt !== null
                      return (
                        <tr key={u.id} className={cn('hover:bg-bg-secondary neo-transition', isDeleted && 'opacity-65')}>
                          <td className="py-3 font-bold text-text-primary">{u.name}</td>
                          <td className="py-3 text-text-secondary">{u.email}</td>
                          <td className="py-3 font-mono text-xs text-text-secondary">{u.timezone}</td>
                          <td className="py-3">
                            <button
                              onClick={() => handleToggleOnboarding(u.id, u.onboardingCompleted)}
                              className={cn(
                                'px-2 py-0.5 text-xs font-bold rounded-sm border cursor-pointer neo-transition',
                                u.onboardingCompleted
                                  ? 'bg-success/10 text-success border-success hover:bg-success/20'
                                  : 'bg-warning/10 text-warning border-warning hover:bg-warning/20'
                              )}
                              title="Click to toggle onboarding status"
                            >
                              {u.onboardingCompleted ? 'Yes' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              variant="default"
                              className={cn(
                                'text-[10px] font-bold font-mono px-2 py-0.5 border',
                                isDeleted
                                  ? 'bg-error-bg text-error border-error'
                                  : !u.isApproved
                                  ? 'bg-warning/10 text-warning border-warning'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              )}
                            >
                              {isDeleted ? 'DEACTIVATED' : !u.isApproved ? 'PENDING APPROVAL' : 'ACTIVE'}
                            </Badge>
                          </td>
                          <td className="py-3 text-text-tertiary">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              {!isDeleted && !u.isApproved && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 px-2.5 font-bold text-xs bg-success text-white hover:bg-success/80 cursor-pointer"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/admin/users/${u.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isApproved: true })
                                      })
                                      if (res.ok) {
                                        toast('User approved successfully', 'success')
                                        fetchStats()
                                      } else {
                                        const json = await res.json()
                                        throw new Error(json.error?.message || 'Failed to approve user')
                                      }
                                    } catch (e: any) {
                                      toast(e.message, 'error')
                                    }
                                  }}
                                  title="Approve User"
                                >
                                  Approve
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setEditingUser(u)
                                  setEditName(u.name)
                                  setEditEmail(u.email)
                                  setEditOnboarded(u.onboardingCompleted)
                                  setEditTimezone(u.timezone)
                                  setEditApproved(u.isApproved !== false)
                                  setEditOpen(true)
                                }}
                                title="Edit details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant={isDeleted ? 'primary' : 'danger'}
                                className={cn('h-8 px-2.5 font-bold text-xs', isDeleted ? 'bg-success text-white' : 'bg-error text-white')}
                                onClick={() => handleToggleDelete(u.id, isDeleted)}
                                title={isDeleted ? 'Restore user' : 'Deactivate user'}
                              >
                                {isDeleted ? 'Restore' : 'Deactivate'}
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                className="h-8 w-8 p-0 bg-red-600 border-red-700 hover:bg-red-700 text-white"
                                onClick={() => handleHardDelete(u.id, u.name)}
                                title="Delete user permanently"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card padding="lg" className="text-center py-12">
          <p className="text-sm text-text-tertiary">Failed to load admin telemetry dashboard.</p>
        </Card>
      )}

      {/* CREATE USER MODAL */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create SaaS User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="neo-label">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="neo-input text-text-primary"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="neo-label">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="neo-input text-text-primary"
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div className="flex items-center gap-2 py-2 text-left">
            <input
              type="checkbox"
              id="new-onboarded"
              checked={newOnboarded}
              onChange={(e) => setNewOnboarded(e.target.checked)}
              className="w-4 h-4 border-2 border-border accent-accent"
            />
            <label htmlFor="new-onboarded" className="font-semibold text-sm cursor-pointer select-none">
              Onboarding Completed
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t-2 border-border">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-accent text-accent-text font-bold">
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingUser(null) }} title="Edit SaaS User">
        <form onSubmit={handleEditUser} className="space-y-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="neo-label">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="neo-input text-text-primary"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="neo-label">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="neo-input text-text-primary"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="neo-label">Timezone</label>
            <select
              value={editTimezone}
              onChange={(e) => setEditTimezone(e.target.value)}
              className="neo-input text-text-primary font-medium"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 py-2 text-left">
            <input
              type="checkbox"
              id="edit-onboarded"
              checked={editOnboarded}
              onChange={(e) => setEditOnboarded(e.target.checked)}
              className="w-4 h-4 border-2 border-border accent-accent"
            />
            <label htmlFor="edit-onboarded" className="font-semibold text-sm cursor-pointer select-none">
              Onboarding Completed
            </label>
          </div>

          <div className="flex items-center gap-2 py-2 text-left">
            <input
              type="checkbox"
              id="edit-approved"
              checked={editApproved}
              onChange={(e) => setEditApproved(e.target.checked)}
              className="w-4 h-4 border-2 border-border accent-accent"
            />
            <label htmlFor="edit-approved" className="font-semibold text-sm cursor-pointer select-none">
              Account Approved
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t-2 border-border">
            <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditingUser(null) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-accent text-accent-text font-bold">
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
