import { db } from '@/lib/db'

export interface CreateJournalData {
  userId: string
  title?: string
  content: string
  entryType?: string
  moodBefore?: number
  moodAfter?: number
  energyBefore?: number
  energyAfter?: number
  tags?: string[]
  entryDate?: string
}

export interface JournalFilters {
  entryType?: string
  tags?: string[]
  fromDate?: string
  toDate?: string
}

export const journalService = {
  async createEntry(data: CreateJournalData) {
    return db.journalEntry.create({
      data: {
        userId: data.userId,
        title: data.title ?? null,
        content: data.content,
        entryType: data.entryType ?? 'free',
        moodBefore: data.moodBefore ?? null,
        moodAfter: data.moodAfter ?? null,
        energyBefore: data.energyBefore ?? null,
        energyAfter: data.energyAfter ?? null,
        tags: data.tags ?? [],
        entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
        metadata: {},
      },
    })
  },

  async getEntry(id: string) {
    const entry = await db.journalEntry.findUnique({ where: { id } })
    if (!entry || entry.deletedAt) return null
    return entry
  },

  async listEntries(userId: string, filters?: JournalFilters) {
    const where: any = { userId, deletedAt: null }
    if (filters?.entryType) where.entryType = filters.entryType
    if (filters?.tags && filters.tags.length > 0) where.tags = { hasSome: filters.tags }
    if (filters?.fromDate || filters?.toDate) {
      where.entryDate = {}
      if (filters.fromDate) where.entryDate.gte = new Date(filters.fromDate)
      if (filters.toDate) where.entryDate.lte = new Date(filters.toDate)
    }
    return db.journalEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
    })
  },

  async getLatestEntries(userId: string, count: number) {
    return db.journalEntry.findMany({
      where: { userId, deletedAt: null },
      orderBy: { entryDate: 'desc' },
      take: count,
    })
  },

  async analyzeEntry(id: string) {
    const entry = await db.journalEntry.findUnique({ where: { id } })
    if (!entry || entry.deletedAt) return null

    const content = entry.content
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const charCount = content.length

    const positiveWords = ['good', 'great', 'happy', 'love', 'wonderful', 'amazing', 'excited', 'grateful', 'peaceful', 'joy', 'beautiful', 'awesome', 'fantastic', 'thankful', 'blessed', 'proud', 'hopeful', 'inspired', 'motivated', 'energized']
    const negativeWords = ['bad', 'sad', 'angry', 'frustrated', 'tired', 'stressed', 'anxious', 'worried', 'depressed', 'lonely', 'upset', 'hurt', 'disappointed', 'overwhelmed', 'exhausted', 'burnout', 'fear', 'hate', 'terrible', 'awful']
    const lower = content.toLowerCase()

    const positiveCount = positiveWords.filter((w) => lower.includes(w)).length
    const negativeCount = negativeWords.filter((w) => lower.includes(w)).length
    const sentimentScore = wordCount > 0 ? Math.round(((positiveCount - negativeCount) / wordCount) * 100) : 0

    const extractedTags: string[] = []
    const tagPatterns = /#(\w+)/g
    let match
    while ((match = tagPatterns.exec(content)) !== null) {
      extractedTags.push(match[1])
    }

    return {
      id: entry.id,
      wordCount,
      charCount,
      sentimentScore,
      sentiment: sentimentScore > 5 ? 'positive' : sentimentScore < -5 ? 'negative' : 'neutral',
      positiveWordsFound: positiveCount,
      negativeWordsFound: negativeCount,
      extractedTags: [...new Set(extractedTags)],
      estimatedReadingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)),
    }
  },

  async deleteEntry(id: string) {
    const entry = await db.journalEntry.findUnique({ where: { id } })
    if (!entry || entry.deletedAt) return null
    await db.journalEntry.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  },
}
