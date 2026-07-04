'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Modal, Input, Textarea } from '@/components/ui'
import { Users, Plus, Trash2, Heart, Calendar, MessageSquare, Loader2, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatDate } from '@/lib/utils'

interface DbRelationship {
  id: string
  name: string
  relationshipType: string
  importance?: number | null
  lastContact?: string | null
  notes?: string | null
}

const TYPE_BADGES: Record<string, 'primary' | 'success' | 'warning' | 'accent' | 'default'> = {
  family: 'success',
  friend: 'primary',
  colleague: 'accent',
  mentor: 'warning',
  other: 'default',
}

export default function RelationshipsPage() {
  const user = useAuthStore((s) => s.user)

  const [relationships, setRelationships] = useState<DbRelationship[]>([])
  const [loading, setLoading] = useState(true)

  // Creation State
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [relationshipType, setRelationshipType] = useState('friend')
  const [importance, setImportance] = useState(5)
  const [lastContact, setLastContact] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchRelationships()
    }
  }, [user])

  async function fetchRelationships() {
    setLoading(true)
    try {
      const res = await fetch(`/api/relationships?userId=${user?.id}`)
      const json = await res.json()
      if (json.data) {
        setRelationships(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !name.trim() || saving) return

    setSaving(true)
    try {
      const res = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim(),
          relationshipType,
          importance,
          lastContact: lastContact || null,
          notes: notes.trim() || null,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setName('')
        setRelationshipType('friend')
        setImportance(5)
        setLastContact('')
        setNotes('')
        fetchRelationships()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return
    if (!confirm('Are you sure you want to delete this relationship?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/relationships/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setRelationships((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relationships</h1>
          <p className="text-sm text-text-secondary">
            Nurture the important people in your life
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Person
        </Button>
      </div>

      {/* Chief of Staff Coach Advice */}
      <Card variant="ai" padding="md" className="flex gap-3 items-start animate-fade-in">
        <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0 animate-pulse" />
        <div className="space-y-1">
          <h2 className="neo-label text-accent">Chief of Staff Insights</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Personal relationships and mentoring sessions contribute significantly to mental resilience and long-term energy compounding. Set contact targets to maintain healthy balance.
          </p>
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <span className="text-sm text-text-tertiary block mt-2 animate-pulse">Loading contacts vault...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        relationships.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relationships.map((rel) => (
              <Card key={rel.id} padding="md" className="space-y-3 hover:shadow-md transition-shadow relative">
                <button
                  onClick={() => handleDelete(rel.id)}
                  disabled={deletingId === rel.id}
                  className="absolute top-3 right-3 text-text-tertiary hover:text-error transition-colors p-1"
                  aria-label="Delete relationship"
                >
                  {deletingId === rel.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>

                <div className="space-y-1.5 pr-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate">{rel.name}</h3>
                    <Badge variant={TYPE_BADGES[rel.relationshipType] || 'default'} className="text-[9px] capitalize px-1.5 py-0">
                      {rel.relationshipType}
                    </Badge>
                  </div>
                  {rel.notes && (
                    <p className="text-xs text-text-secondary line-clamp-2 italic">{rel.notes}</p>
                  )}
                </div>

                <div className="border-t border-border-light pt-2.5 space-y-2 text-xs text-text-tertiary">
                  {rel.importance && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span>Priority Level</span>
                        <span className="text-accent">{rel.importance}/10</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${rel.importance * 10}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {rel.lastContact && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Last Contact: {formatDate(new Date(rel.lastContact))}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-text-tertiary" />
              <h2 className="text-lg font-semibold">No relationships yet</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Add important people and track how you stay connected.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add your first contact
              </Button>
            </div>
          </Card>
        )
      )}

      {/* Creation Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Person">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="neo-label block mb-1 text-xs">Relationship Type</label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="neo-border rounded-sm w-full px-2.5 py-2 bg-surface text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="friend">Friend</option>
              <option value="family">Family</option>
              <option value="colleague">Colleague</option>
              <option value="mentor">Mentor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="neo-label block mb-1 text-xs">Importance/Priority: {importance}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <Input
            label="Last Contact Date"
            type="date"
            value={lastContact}
            onChange={(e) => setLastContact(e.target.value)}
          />

          <Textarea
            label="Notes"
            placeholder="e.g. Schedule calls on weekends, key details to ask about..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 border-t-2 border-border pt-3 mt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
