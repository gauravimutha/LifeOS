import { db } from '@/lib/db'

export interface CreateEventData {
  userId: string
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  isAllDay?: boolean
  eventType?: string
  externalId?: string
  externalSource?: string
}

export const calendarService = {
  async createEvent(data: CreateEventData) {
    return db.calendarEvent.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isAllDay: data.isAllDay ?? false,
        eventType: data.eventType ?? null,
        externalId: data.externalId ?? null,
        externalSource: data.externalSource ?? null,
        status: 'confirmed',
        metadata: {},
      },
    })
  },

  async getEventsInRange(userId: string, fromDate: string, toDate: string) {
    return db.calendarEvent.findMany({
      where: {
        userId,
        deletedAt: null,
        startTime: { lte: new Date(toDate) },
        endTime: { gte: new Date(fromDate) },
      },
      orderBy: { startTime: 'asc' },
    })
  },

  async updateEvent(id: string, data: Partial<CreateEventData & { status: string }>) {
    const existing = await db.calendarEvent.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return null

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime)
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime)
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay
    if (data.eventType !== undefined) updateData.eventType = data.eventType
    if (data.status !== undefined) updateData.status = data.status

    return db.calendarEvent.update({ where: { id }, data: updateData })
  },

  async deleteEvent(id: string) {
    const event = await db.calendarEvent.findUnique({ where: { id } })
    if (!event || event.deletedAt) return null
    await db.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  },

  async getConflicts(userId: string, startTime: string, endTime: string) {
    const start = new Date(startTime)
    const end = new Date(endTime)

    const events = await db.calendarEvent.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { not: 'cancelled' },
        startTime: { lt: end },
        endTime: { gt: start },
      },
      orderBy: { startTime: 'asc' },
    })

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
      overlapMinutes: Math.round((Math.min(end.getTime(), e.endTime.getTime()) - Math.max(start.getTime(), e.startTime.getTime())) / 60000),
    }))
  },

  async syncExternal(source: string, events: Array<{
    externalId: string
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
  }>) {
    const results: Array<{ externalId: string; status: 'created' | 'updated' | 'skipped' }> = []

    for (const event of events) {
      const existing = await db.calendarEvent.findFirst({
        where: { externalId: event.externalId, externalSource: source },
      })

      if (existing) {
        await db.calendarEvent.update({
          where: { id: existing.id },
          data: {
            title: event.title,
            description: event.description ?? existing.description,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            location: event.location ?? existing.location,
          },
        })
        results.push({ externalId: event.externalId, status: 'updated' })
      } else {
        results.push({ externalId: event.externalId, status: 'skipped' })
      }
    }

    return { synced: results.filter((r) => r.status !== 'skipped').length, skipped: results.filter((r) => r.status === 'skipped').length, results }
  },
}
