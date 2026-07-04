import { db } from '@/lib/db'
import type { AIMemoryType } from '@/types'

export interface StoreMemoryData {
  userId: string
  type: AIMemoryType
  key: string
  value: unknown
  confidence?: number
  expiresAt?: string
}

export const memoryService = {
  async storeMemory(data: StoreMemoryData) {
    const existing = await db.aIMemory.findUnique({
      where: { userId_key: { userId: data.userId, key: data.key } },
    })

    if (existing) {
      return db.aIMemory.update({
        where: { id: existing.id },
        data: {
          value: data.value as any,
          confidence: data.confidence ?? existing.confidence,
          isActive: true,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt,
        },
      })
    }

    return db.aIMemory.create({
      data: {
        userId: data.userId,
        memoryType: data.type,
        key: data.key,
        value: data.value as any,
        confidence: data.confidence ?? 1.0,
        isActive: true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        metadata: {},
      },
    })
  },

  async getMemory(userId: string, key: string) {
    const memory = await db.aIMemory.findUnique({
      where: { userId_key: { userId, key } },
    })
    if (!memory || memory.deletedAt || !memory.isActive) return null
    if (memory.expiresAt && memory.expiresAt < new Date()) {
      await db.aIMemory.update({ where: { id: memory.id }, data: { isActive: false } })
      return null
    }
    return memory
  },

  async searchMemories(userId: string, query: string) {
    const memories = await db.aIMemory.findMany({
      where: { userId, isActive: true, deletedAt: null },
      orderBy: { confidence: 'desc' },
    })

    const lowerQuery = query.toLowerCase()
    const results = memories.filter((m) => {
      const keyMatch = m.key.toLowerCase().includes(lowerQuery)
      const valueStr = JSON.stringify(m.value).toLowerCase()
      const valueMatch = valueStr.includes(lowerQuery)
      const typeMatch = m.memoryType.toLowerCase().includes(lowerQuery)
      return keyMatch || valueMatch || typeMatch
    })

    return results.filter((m) => {
      if (m.expiresAt && m.expiresAt < new Date()) return false
      return true
    })
  },

  async getActiveMemories(userId: string) {
    const memories = await db.aIMemory.findMany({
      where: { userId, isActive: true, deletedAt: null },
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    })

    return memories.filter((m) => {
      if (m.expiresAt && m.expiresAt < new Date()) {
        db.aIMemory.update({ where: { id: m.id }, data: { isActive: false } }).catch(() => {})
        return false
      }
      return true
    })
  },

  async updateMemory(id: string, data: { value?: unknown; confidence?: number; isActive?: boolean }) {
    const existing = await db.aIMemory.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return null

    const updateData: any = {}
    if (data.value !== undefined) updateData.value = data.value as any
    if (data.confidence !== undefined) updateData.confidence = data.confidence
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    return db.aIMemory.update({ where: { id }, data: updateData })
  },

  async deleteMemory(id: string) {
    const memory = await db.aIMemory.findUnique({ where: { id } })
    if (!memory || memory.deletedAt) return null
    await db.aIMemory.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  },

  async getRelevantContext(userId: string, contextType: AIMemoryType) {
    const memories = await db.aIMemory.findMany({
      where: { userId, memoryType: contextType, isActive: true, deletedAt: null },
      orderBy: { confidence: 'desc' },
    })

    return memories.filter((m) => {
      if (m.expiresAt && m.expiresAt < new Date()) {
        db.aIMemory.update({ where: { id: m.id }, data: { isActive: false } }).catch(() => {})
        return false
      }
      return true
    })
  },
}
