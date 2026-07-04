import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface JournalEntry {
  id: string
  title: string
  content: string
  mood: number
  energy: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface CreateJournalInput {
  title: string
  content: string
  mood?: number
  energy?: number
  tags?: string[]
}

const JOURNAL_KEY = ['journal'] as const

async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const res = await fetch('/api/journal')
  if (!res.ok) throw new Error('Failed to fetch journal entries')
  return res.json()
}

async function createEntry(input: CreateJournalInput): Promise<JournalEntry> {
  const res = await fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create journal entry')
  return res.json()
}

export function useJournalEntries() {
  return useQuery({
    queryKey: JOURNAL_KEY,
    queryFn: fetchJournalEntries,
  })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOURNAL_KEY })
    },
  })
}
